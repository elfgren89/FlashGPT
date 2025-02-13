/* File: backend/scraper.js */
const axios = require("axios");
const cheerio = require("cheerio");
const iconv = require("iconv-lite");
const http = require("http");
const https = require("https");
const { sleep, randomDelay } = require('./utils');

// Remove Puppeteer-related code and configurations
const MAX_CONCURRENT_SCRAPES = process.env.MAX_CONCURRENT_SCRAPES || 3;
const SCRAPE_TIMEOUT = process.env.SCRAPE_TIMEOUT_MS || 30000;

// Circuit breaker for scraping to prevent overwhelming the server
class ScrapingCircuitBreaker {
  constructor(maxConcurrent = MAX_CONCURRENT_SCRAPES) {
    this.maxConcurrent = maxConcurrent;
    this.currentConcurrent = 0;
    this.queue = [];
  }

  async execute(task) {
    return new Promise((resolve, reject) => {
      const wrappedTask = async () => {
        this.currentConcurrent++;
        try {
          const result = await Promise.race([
            task(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Scraping timeout')), SCRAPE_TIMEOUT)
            )
          ]);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.currentConcurrent--;
          this.processQueue();
        }
      };

      if (this.currentConcurrent < this.maxConcurrent) {
        wrappedTask();
      } else {
        this.queue.push(wrappedTask);
      }
    });
  }

  processQueue() {
    while (this.currentConcurrent < this.maxConcurrent && this.queue.length) {
      const task = this.queue.shift();
      task();
    }
  }
}

const scrapingCircuitBreaker = new ScrapingCircuitBreaker();

/**
 * Hämtar trådinformation (totalt antal sidor och trådtitel) med Puppeteer.
 * Förväntar sig att sidan innehåller:
 *   - Ett <span> med klassen "select2-selection__placeholder" som visar tex "Sidan 1 av 1025"
 *   - Trådtiteln i ".page-title h1 a"
 * @param {string} url - URL för trådens första sida.
 * @returns {Object} - { maxPageCount: number|null, threadTitle: string|null }
 */
async function fetchThreadInfo(url) {
  try {
    const axiosInstance = axios.create({
      httpAgent: new http.Agent({ keepAlive: true }),
      httpsAgent: new https.Agent({ keepAlive: true }),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "sv-SE,sv;q=0.9,en-US;q=0.8,en;q=0.7"
      },
      responseType: "arraybuffer",
      timeout: 10000,
    });

    const response = await axiosInstance.get(url);
    const html = iconv.decode(response.data, "latin1");
    const $ = cheerio.load(html);
    
    let maxPageCount = 1;
    let threadTitle = null;
    
    // Updated pagination detection that works with static HTML
    const paginationLinks = $(".pagination a[href*='p']");
    if (paginationLinks.length > 0) {
      // Get the last pagination link's page number
      const lastPageHref = paginationLinks.last().attr("href");
      const match = lastPageHref.match(/p(\d+)$/);
      if (match) {
        maxPageCount = parseInt(match[1], 10);
      }
    } else {
      // Fallback to original Puppeteer-style detection
      const pageCountText = $("span.select2-selection__placeholder").text();
      const pageMatch = pageCountText.match(/av\s+(\d+)/i);
      if (pageMatch) {
        maxPageCount = parseInt(pageMatch[1], 10);
      }
    }

    // Get thread title
    threadTitle = $(".page-title h1 a").text().trim() || 
                 $("h1.entry-title").text().trim(); // Fallback selector

    return { 
      maxPageCount: Math.max(maxPageCount, 1), // Ensure at least 1 page
      threadTitle 
    };
  } catch (error) {
    console.error("Error fetching thread info:", error.message);
    return { maxPageCount: 1, threadTitle: null };
  }
}

/**
 * Hämtar en enskild sida.
 * @param {number} pageNumber - Sidnummer att hämta.
 * @param {string} url - Bas-URL för tråden.
 * @param {Object} axiosInstance - Den konfigurerade Axios-instansen.
 * @returns {Object} - { page: number, posts: Array, [error]: string }
 */
async function fetchPage(pageNumber, url, axiosInstance) {
  const pageUrl = pageNumber === 1 ? url : `${url}p${pageNumber}`;
  try {
    const response = await axiosInstance.get(pageUrl);
    const html = iconv.decode(response.data, "latin1");
    const $ = cheerio.load(html);
    let pagePosts = [];
    $("div.post").each((i, elem) => {
      const content = $(elem).find(".post_message").text().trim();
      let postNumber = $(elem).find("a[id^='postcount']").text().trim();
      if (!postNumber) postNumber = "Okänt";
      if (content) {
        pagePosts.push({ postNumber, content, page: pageNumber });
      }
    });
    return { page: pageNumber, posts: pagePosts };
  } catch (error) {
    return { page: pageNumber, posts: [], error: error.message };
  }
}

/**
 * Skrapar en forumtråd från Flashback Forum med paginering.
 * Sidorna bearbetas i kontrollerade parallella grupper för att snabba upp skrapningen utan att bli upptäckt.
 *
 * @param {string} url - Bas-URL för tråden (utan sidnummer).
 * @param {number} interval - Hur många sidor att hoppa över mellan skrapningar (standard 1 = alla sidor).
 * @param {number} delay - Grundläggande fördröjning (ms) mellan grupper (standard 2000 ms).
 * @param {number|null} maxPages - Max antal sidor att skrapa (null = ingen gräns).
 * @param {function} [logCallback] - Valfri callback för loggning.
 * @returns {Object} - { posts: Array, logMessages: Array }
 */
async function scrapeForumThread(url, interval = 1, delay = 2000, maxPages = null, logCallback = null) {
  let posts = [];
  let logMessages = [];

  const pushLog = (msg) => {
    if (!msg) return;
    logMessages.push(msg);
    console.log(msg);
    if (typeof logCallback === "function") {
      logCallback(msg);
    }
  };

  // Hämta trådinformation (antal sidor och titel)
  let { maxPageCount, threadTitle } = await fetchThreadInfo(url);
  if (maxPageCount !== null) {
    pushLog(`Totalt antal sidor: ${maxPageCount}`);
  } else {
    pushLog("Kunde inte läsa totalt antal sidor. Fortsätter med 1 sida.");
    maxPageCount = 1;
  }
  if (threadTitle) {
    pushLog(`Trådtitel: ${threadTitle}`);
  }

  // Bygg en lista med sidnummer att hämta.
  const pageNumbers = [];
  for (let p = 1; p <= maxPageCount; p += interval) {
    pageNumbers.push(p);
    if (maxPages !== null && pageNumbers.length >= maxPages) break;
  }

  // Skapa en Axios-instans med keep-alive och browser-liknande headers.
  const axiosInstance = axios.create({
    httpAgent: new http.Agent({ keepAlive: true }),
    httpsAgent: new https.Agent({ keepAlive: true }),
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "sv-SE,sv;q=0.9,en-US;q=0.8,en;q=0.7"
    },
    responseType: "arraybuffer",
    timeout: 10000,
  });

  // Definiera hur många sidor som hämtas parallellt.
  const concurrencyLimit = 3;

  for (let i = 0; i < pageNumbers.length; i += concurrencyLimit) {
    const batch = pageNumbers.slice(i, i + concurrencyLimit);
    // Logga "Skrapar sida ..." i ordning innan vi startar förfrågningarna.
    batch.forEach(p => {
      const pageUrl = p === 1 ? url : `${url}p${p}`;
      pushLog(`Skrapar sida ${p}: ${pageUrl}`);
    });

    // Hämta sidorna parallellt.
    const batchResults = await Promise.all(
      batch.map(p => scrapingCircuitBreaker.execute(() => fetchPage(p, url, axiosInstance)))
    );
    // Sortera resultaten efter sidnummer, ifall de skulle komma i fel ordning.
    batchResults.sort((a, b) => a.page - b.page);
    batchResults.forEach(result => {
      if (result.error) {
        pushLog(`Fel vid skrapning av sida ${result.page}: ${result.error}`);
      } else {
        pushLog(`Hittade ${result.posts.length} inlägg på sida ${result.page}.`);
      }
      posts = posts.concat(result.posts);
    });

    const randomDelayTime = randomDelay(delay);
    pushLog(`Väntar ${randomDelayTime} ms innan nästa skrapning...`);
    await sleep(randomDelayTime);
  }
  return { posts, logMessages };
}

module.exports = { scrapeForumThread, fetchThreadInfo };
