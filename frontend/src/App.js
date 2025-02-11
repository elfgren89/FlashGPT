// File: frontend/src/App.js
import React, { useState } from "react";
import ForumThread from "./components/ForumThread";
import AnalysisPanel from "./components/AnalysisPanel";
import ScraperLogStream from "./components/ScraperLogStream";
import ScraperControl from "./components/ScraperControl"; // Importera den nya komponenten
import Spinner from "./components/Spinner";

// Hämta API-bas URL från miljövariabeln
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

function App() {
  const [forumUrl, setForumUrl] = useState("");
  const [scrapeInterval, setScrapeInterval] = useState("1");
  const [maxPages, setMaxPages] = useState("");
  const [pageCount, setPageCount] = useState(null);
  const [threadTitle, setThreadTitle] = useState("");
  const [estimatedPosts, setEstimatedPosts] = useState(null);
  const [scrapeResult, setScrapeResult] = useState(null);
  const [analysisResult, setAnalysisResult] = useState("");
  const [sseActive, setSseActive] = useState(false);
  const [scrapeLogs, setScrapeLogs] = useState("");
  const [loadingAnalyze, setLoadingAnalyze] = useState(false);
  const [loadingPageCount, setLoadingPageCount] = useState(false);

  // Steg 1: Hämta trådinformation (antal sidor, titel, uppskattade inlägg)
  const fetchThreadInfo = async () => {
    if (!forumUrl) return;
    setLoadingPageCount(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/page-count?url=${encodeURIComponent(forumUrl)}`
      );
      const data = await response.json();
      setPageCount(data.maxPageCount);
      setThreadTitle(data.threadTitle);
      setEstimatedPosts(data.estimatedPosts);
    } catch (error) {
      console.error("Fel vid hämtning av trådinformation:", error);
    } finally {
      setLoadingPageCount(false);
    }
  };

  // Steg 2: Starta skrapning efter att trådinformation har hämtats
  const handleScrape = () => {
    if (!forumUrl || pageCount === null) return;
    if (sseActive) return;
    setScrapeResult(null);
    setAnalysisResult("");
    setScrapeLogs("");
    setSseActive(true);
  };

  const handleAnalyze = async (question = "") => {
    if (!scrapeResult || !scrapeResult.fullText) return;
    try {
      setLoadingAnalyze(true);
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json;charset=utf-8" },
        body: JSON.stringify({ text: scrapeResult.fullText, question }),
      });
      const data = await response.json();
      setAnalysisResult(data.result);
    } catch (error) {
      console.error("Fel vid analys:", error);
    } finally {
      setLoadingAnalyze(false);
    }
  };

  const handleLogLine = (line) => {
    setScrapeLogs((prev) => prev + line + "\n");
  };

  const headerStyle = {
    background: "url('/FlashGPTTransparentLogo.png') no-repeat center",
    backgroundSize: "contain", // eller "cover"
    padding: "100px 0",
    textAlign: "center",
    fontSize: "3em",
  };

  return (
    <div className="container">
      <h1 style={headerStyle}></h1>
      <p>Din AI-assistent för flashback.org</p>
      {/* Använd den separerade ScraperControl-komponenten */}
      <ScraperControl
        forumUrl={forumUrl}
        setForumUrl={setForumUrl}
        fetchThreadInfo={fetchThreadInfo}
        loadingPageCount={loadingPageCount}
        pageCount={pageCount}
        threadTitle={threadTitle}
        estimatedPosts={estimatedPosts}
        scrapeInterval={scrapeInterval}
        setScrapeInterval={setScrapeInterval}
        maxPages={maxPages}
        setMaxPages={setMaxPages}
        handleScrape={handleScrape}
        sseActive={sseActive}
      />

      {sseActive && (
        <ScraperLogStream
          forumUrl={forumUrl}
          interval={scrapeInterval}
          maxPages={maxPages}
          onLogLine={(line) => {}}
          onResult={(result) => {
            setScrapeResult(result);
            setSseActive(false);
          }}
        />
      )}

      {scrapeLogs && (
        <div
          style={{
            margin: "20px auto",
            maxWidth: "650px",
            backgroundColor: "#111",
            padding: "20px",
            borderRadius: "8px",
            boxShadow: "0 0 10px #00ff00",
            textAlign: "left",
            whiteSpace: "pre-wrap",
          }}
        >
          <h2 style={{ marginTop: "0" }}>Skraplogg</h2>
          {scrapeLogs}
        </div>
      )}

      {scrapeResult && (
        <>
          <AnalysisPanel
            onAnalyze={handleAnalyze}
            analysisResult={analysisResult}
            loadingAnalyze={loadingAnalyze}
            tokenInfo={scrapeResult?.tokenInfo}
            posts={scrapeResult?.posts}
          />
          <ForumThread
            posts={scrapeResult.posts}
            tokenInfo={scrapeResult.tokenInfo}
          />
        </>
      )}
    </div>
  );
}

export default App;
