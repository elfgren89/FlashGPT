/* File: backend/server.js */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");
const scraper = require("./scraper");
const { countTokensAndCost } = require("./tokenCounter");
const { analyzeText } = require("./model");

const app = express();
const PORT = process.env.PORT || 5000;

// -------------------------
// Middleware
// -------------------------

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "För många förfrågningar från denna IP, försök igen senare.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// JSON Parsing Limit
app.use(express.json({ limit: "100mb" }));

// CORS Configuration
app.use(cors({
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : "*",
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// UTF-8 Encoding for JSON Responses
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// -------------------------
// Serve Frontend Static Files
// -------------------------
if (process.env.NODE_ENV === "production") {
  // Servera statiska filer från /backend/frontend/build
  app.use(express.static(path.join(__dirname, "frontend/build")));

  // Hantera React Router - skicka index.html för okända routes
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "frontend/build", "index.html"));
  });
}

// -------------------------
// API Endpoints
// -------------------------

// Scrape Forum Thread
app.get("/api/scrape", async (req, res) => {
  const { url, interval = 1, maxPages = null } = req.query;

  if (!url) return res.status(400).json({ error: "Parameter 'url' saknas" });

  try {
    const result = await scraper.scrapeForumThread(
      url,
      parseInt(interval, 10),
      2000,
      parseInt(maxPages, 10)
    );
    const posts = result.posts;
    const fullText = posts.map((p) => p.content).join("\n\n");
    const tokenInfo = countTokensAndCost(fullText);

    res.json({ posts, fullText, tokenInfo, logMessages: result.logMessages });
  } catch (error) {
    console.error("Fel vid skrapning:", error);
    res.status(500).json({ error: "Fel vid skrapning" });
  }
});

// Scrape Stream (SSE)
app.get("/api/scrape-stream", async (req, res) => {
  const { url, interval = 1, maxPages = null } = req.query;

  if (!url) return res.status(400).json({ error: "Parameter 'url' saknas" });

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  const logCallback = (msg) => {
    if (msg) res.write(`data: ${msg}\n\n`);
  };

  try {
    const result = await scraper.scrapeForumThread(
      url,
      parseInt(interval, 10),
      2000,
      parseInt(maxPages, 10),
      logCallback
    );
    const posts = result.posts;
    const fullText = posts.map((p) => p.content).join("\n\n");
    const tokenInfo = countTokensAndCost(fullText);

    res.write(
      `event: result\ndata: ${JSON.stringify({
        posts,
        fullText,
        tokenInfo,
        logMessages: result.logMessages,
      })}\n\n`
    );
    res.end();
  } catch (error) {
    res.write(`data: Fel vid skrapning: ${error.message}\n\n`);
    res.end();
  }
});

// Analyze Text
app.post("/api/analyze", async (req, res) => {
  const { text, question } = req.body;

  if (!text) return res.status(400).json({ error: "Text saknas i förfrågan" });

  try {
    const analysisResult = await analyzeText({ text, question });
    if (!analysisResult) {
      return res.status(500).json({ error: "Inget analysresultat genererades" });
    }

    res.json({ result: analysisResult, status: "success" });
  } catch (error) {
    console.error("Fel vid analys:", error);
    res.status(500).json({ error: "Fel vid analys" });
  }
});

// Get Page Count and Thread Info
const { fetchThreadInfo } = require("./scraper");
app.get("/api/page-count", async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "Parameter 'url' saknas" });

  try {
    const { maxPageCount, threadTitle } = await fetchThreadInfo(url);
    res.json({ maxPageCount, threadTitle, estimatedPosts: maxPageCount * 12 });
  } catch (error) {
    console.error("Fel vid hämtning av trådinformation:", error.message);
    res.status(500).json({ error: "Fel vid hämtning av trådinformation" });
  }
});

// Get Popular Threads
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

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// -------------------------
// Start Server
// -------------------------
app.listen(PORT, () => {
  console.log(`✅ Servern kör på port ${PORT}`);
});
