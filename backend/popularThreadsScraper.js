/* File: backend/popularThreadsScraper.js */
const axios = require("axios");
const cheerio = require("cheerio");
const iconv = require("iconv-lite");

async function getPopularThreads() {
  const url = "https://www.flashback.org/populara-amnen/";
  try {
    // Request the page as an arraybuffer and decode using latin1 to preserve Swedish characters
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "sv-SE,sv;q=0.9",
        "Referer": "https://www.flashback.org/",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate"
      }
    });

    const html = iconv.decode(response.data, "latin1");
    const $ = cheerio.load(html);
    const threads = [];

    $("a.thread-title").each((i, el) => {
      const title = $(el).text().trim();
      const threadUrl = $(el).attr("href");
      // Get the category from the sibling element with class "thread-forum-title"
      const category = $(el).siblings("a.thread-forum-title").first().text().trim();

      // Use the closest table row to find the div.text-muted element that contains views, readers, and replies
      const parentRow = $(el).closest("tr");
      const textMuted = parentRow.find("div.text-muted").first().text().trim();

      let views = null;
      let replies = null;
      if (textMuted) {
        // The text may look like: "934 visningar • 21 läsare • 46 svar"
        // We use a regex to capture the first number (visningar) and the last number (svar),
        // ignoring any numbers in between.
        const regex = /([\d\s\u00A0]+)\s*visningar.*?([\d\s\u00A0]+)\s*svar/i;
        const matches = textMuted.match(regex);
        if (matches && matches.length === 3) {
          views = Number(matches[1].replace(/[\s\u00A0]/g, ""));
          replies = Number(matches[2].replace(/[\s\u00A0]/g, ""));
        } else {
          console.warn("No match found for textMuted:", textMuted);
        }
      }
      
      threads.push({
        title,
        url: threadUrl ? "https://www.flashback.org" + threadUrl : null,
        category,
        views,
        replies,
      });
    });

    return threads;
  } catch (error) {
    console.error("Fel vid hämtning av populära ämnen:", error.message);

    // Log more details if Axios response exists
    if (error.response) {
      console.error("Status code:", error.response.status);
      console.error("Response headers:", error.response.headers);
      try {
        // Log first 200 characters of the response, if possible
        const partialData = iconv.decode(error.response.data, "latin1").slice(0, 200);
        console.error("Partial response data:", partialData);
      } catch (decodeError) {
        console.error("Kunde inte decoda eller läsa response-data:", decodeError.message);
      }
    }

    // Log full error object for debugging
    console.error("Full error object:", error);

    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response headers:", error.response.headers);
      console.error("Full response body:", iconv.decode(error.response.data, "latin1"));
    }

    throw new Error("Kunde inte hämta populära trådar. Försök igen senare.");
  }

    throw error;
  }

module.exports = { getPopularThreads };
