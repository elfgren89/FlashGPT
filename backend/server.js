/* File: backend/server.js */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require('express-rate-limit');
const scraper = require("./scraper");
const { countTokensAndCost } = require("./tokenCounter");
const { analyzeText } = require("./model");

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'För många förfrågningar från denna IP, försök igen senare.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiter to all requests
app.use(limiter);

// Öka JSON‑parsinggränsen om du hanterar stora payloads
app.use(express.json({ limit: "100mb" }));

// Sätt Content-Type med UTF-8 för att säkerställa att åäö visas korrekt
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

app.use(cors({
  origin: "*",// eller "*"
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true // om du använder cookies/sessions
}));

// -------------------------
// Vanlig REST-endpoint
// -------------------------
app.get("/api/scrape", async (req, res) => {
  const forumUrl = req.query.url;
  const interval = req.query.interval ? parseInt(req.query.interval, 10) : 1;
  const maxPages = req.query.maxPages ? parseInt(req.query.maxPages, 10) : null;

  if (!forumUrl) {
    return res.status(400).json({ error: "Parameter 'url' saknas" });
  }

  try {
    const result = await scraper.scrapeForumThread(forumUrl, interval, 2000, maxPages);
    const posts = result.posts;
    const fullText = posts.map((p) => p.content).join("\n\n");
    const tokenInfo = countTokensAndCost(fullText);
    res.json({ posts, fullText, tokenInfo, logMessages: result.logMessages });
  } catch (error) {
    console.error("Fel vid skrapning:", error);
    res.status(500).json({ error: "Fel vid skrapning" });
  }
});

// -------------------------
// SSE-endpoint: Strömmar loggmeddelanden i realtid
// -------------------------
app.get("/api/scrape-stream", async (req, res) => {
  const forumUrl = req.query.url;
  const interval = req.query.interval ? parseInt(req.query.interval, 10) : 1;
  const maxPages = req.query.maxPages ? parseInt(req.query.maxPages, 10) : null;

  if (!forumUrl) {
    res.status(400).json({ error: "Parameter 'url' saknas" });
    return;
  }

  // Sätt upp SSE-headrar
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  // Callback för att skicka loggar direkt till klienten
  const logCallback = (msg) => {
    if (msg !== undefined && msg !== null) {
      res.write(`data: ${msg}\n\n`);
    }
  };

  try {
    const result = await scraper.scrapeForumThread(forumUrl, interval, 2000, maxPages, logCallback);
    const posts = result.posts;
    const fullText = posts.map((p) => p.content).join("\n\n");
    const tokenInfo = countTokensAndCost(fullText);
    // Skicka ett sista SSE-event med hela resultatet
    res.write(
      `event: result\ndata: ${JSON.stringify({ posts, fullText, tokenInfo, logMessages: result.logMessages })}\n\n`
    );
    res.end();
  } catch (error) {
    res.write(`data: Fel vid skrapning: ${error.message}\n\n`);
    res.end();
  }
});

// -------------------------
// Endpoint: Analysera text / ställ en fråga
// -------------------------
app.post("/api/analyze", async (req, res) => {
  const { text, question } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: "Text saknas i förfrågan" });
  }

  try {
    const analysisResult = await analyzeText({ text, question });
    
    // Ensure we have valid content
    if (!analysisResult) {
      return res.status(500).json({ error: "Inget analysresultat genererades" });
    }

    // Send response with explicit structure
    res.json({
      result: analysisResult,
      status: "success"
    });

  } catch (error) {
    console.error("Fel vid analys:", error);
    res.status(500).json({ error: "Fel vid analys" });
  }
});

/* File: backend/server.js */
const { fetchThreadInfo } = require("./scraper");

app.get("/api/page-count", async (req, res) => {
  const forumUrl = req.query.url;
  if (!forumUrl) {
    return res.status(400).json({ error: "Parameter 'url' saknas" });
  }
  try {
    const { maxPageCount, threadTitle } = await fetchThreadInfo(forumUrl);
    // Estimate the number of posts, assuming each full page contains 12 posts.
    const estimatedPosts = maxPageCount * 12;
    res.json({ maxPageCount, threadTitle, estimatedPosts });
  } catch (error) {
    console.error("Fel vid hämtning av trådinformation:", error.message);
    res.status(500).json({ error: "Fel vid hämtning av trådinformation" });
  }
});

// New endpoint for popular threads
const { getPopularThreads } = require("./popularThreadsScraper");
app.get("/api/popular-threads", async (req, res) => {
  try {
    const threads = await getPopularThreads();
    res.json({ threads });
  } catch (error) {
    console.error("Fel vid hämtning av populära ämnen:", error.message);
    res.status(500).json({ error: "Fel vid hämtning av populära ämnen." });
  }
});

app.get("/api/health", (req, res) => {
  res.status(200).send("OK");
});


app.listen(PORT, () => {
  console.log(`Servern kör på port ${PORT}`);
});
