/* File: backend/server.js */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const path = require("path");
const scraper = require("./scraper");
const { countTokensAndCost } = require("./tokenCounter");
const { analyzeText } = require("./model");
const { sleep } = require("./utils");

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "För många förfrågningar från denna IP, försök igen senare.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all requests
app.use(limiter);

// Increase JSON parsing limit for large payloads
app.use(express.json({ limit: "100mb" }));

const corsOptions = {
  origin: "*", // For production, consider whitelisting specific domains.
};
app.use(cors(corsOptions));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : false,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Set Content-Type header to JSON with UTF-8 encoding
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// ------------------------------------------------------------------
// NOTE:
// In a separated services architecture, the frontend container is
// responsible for serving the React static files.
// The following static file–serving middleware is not needed and is commented out.
// ------------------------------------------------------------------
// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  // Serve static files from frontend build
  app.use(express.static(path.join(__dirname, "../frontend/build"), {
    maxAge: '1d',
    setHeaders: (res, path) => {
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  }));
  

  // Handle React routing - return all requests to React app
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
  });
}

// -------------------------
// API Endpoint: Scrape Forum Thread
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
// SSE Endpoint: Stream Scraping Logs
// -------------------------
app.get("/api/scrape-stream", async (req, res) => {
  const forumUrl = req.query.url;
  const interval = req.query.interval ? parseInt(req.query.interval, 10) : 1;
  const maxPages = req.query.maxPages ? parseInt(req.query.maxPages, 10) : null;

  if (!forumUrl) {
    res.status(400).json({ error: "Parameter 'url' saknas" });
    return;
  }

  // Set up SSE headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  // Callback for sending logs to client in real time
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
    // Send a final SSE event with the complete result
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

// -------------------------
// API Endpoint: Analyze Text / Ask a Question
// -------------------------
app.post("/api/analyze", async (req, res) => {
  const { text, question } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Text saknas i förfrågan" });
  }

  try {
    const analysisResult = await analyzeText({ text, question });

    if (!analysisResult) {
      return res.status(500).json({ error: "Inget analysresultat genererades" });
    }

    res.json({
      result: analysisResult,
      status: "success",
    });
  } catch (error) {
    console.error("Fel vid analys:", error);
    res.status(500).json({ error: "Fel vid analys" });
  }
});

// -------------------------
// API Endpoint: Get Page Count and Thread Info
// -------------------------
const { fetchThreadInfo } = require("./scraper");
app.get("/api/page-count", async (req, res) => {
  const forumUrl = req.query.url;
  if (!forumUrl) {
    return res.status(400).json({ error: "Parameter 'url' saknas" });
  }
  try {
    const { maxPageCount, threadTitle } = await fetchThreadInfo(forumUrl);
    // Estimate the number of posts (assuming 12 posts per page)
    const estimatedPosts = maxPageCount * 12;
    res.json({ maxPageCount, threadTitle, estimatedPosts });
  } catch (error) {
    console.error("Fel vid hämtning av trådinformation:", error.message);
    res.status(500).json({ error: "Fel vid hämtning av trådinformation" });
  }
});

// -------------------------
// API Endpoint: Get Popular Threads
// -------------------------
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
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});


// API routes must come AFTER static files
app.use('/api', require('./routes'));  // Your existing API routes

// Handle client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});