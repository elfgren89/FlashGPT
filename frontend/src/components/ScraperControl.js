// File: frontend/src/components/ScraperControl.js
import React from "react";
import ForumUrlInput from "./ForumUrlInput";
import Spinner from "./Spinner";

const ScraperControl = ({
  forumUrl,
  setForumUrl,
  fetchThreadInfo,
  loadingPageCount,
  pageCount,
  threadTitle,
  estimatedPosts,
  scrapeInterval,
  setScrapeInterval,
  maxPages,
  setMaxPages,
  handleScrape,
  sseActive,
}) => {
  // Knappen ska vara inaktiv om SSE är aktiv eller om trådinformation inte är hämtad (pageCount är null)
  const isScrapeDisabled = sseActive || pageCount === null;

  // Stilen för knappen ändras beroende på dess status
  const scrapeButtonStyle = {
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    backgroundColor: isScrapeDisabled ? "#333" : "#00ff00", // Mörkgrå om inaktiv, grön om aktiv
    color: "#000",
    border: "none",
    borderRadius: "4px",
    cursor: isScrapeDisabled ? "default" : "pointer",
  };

  return (
    <div
      style={{
        margin: "30px auto",
        maxWidth: "650px",
        backgroundColor: "#111",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 0 10px #00ff00",
        boxSizing: "border-box",
        width: "100%",
      }}
    >
      <ForumUrlInput
        value={forumUrl}
        onChange={setForumUrl}
        placeholder="Ange forumtrådens URL (t.ex. https://www.flashback.org/t3656554)"
        onSelect={(selectedUrl) => setForumUrl(selectedUrl)}
      />
      <button
        onClick={fetchThreadInfo}
        style={{
          width: "100%",
          padding: "12px",
          fontSize: "16px",
          backgroundColor: "#00ff00",
          color: "#000",
          border: "none",
          borderRadius: "4px",
          marginBottom: "10px",
        }}
        disabled={loadingPageCount || !forumUrl}
      >
        {loadingPageCount ? "Hämtar trådinformation..." : "Hämta trådinformation"}
      </button>
      {loadingPageCount && (
        <div style={{ textAlign: "center", marginBottom: "10px" }}>
          <Spinner />
        </div>
      )}
      {pageCount !== null && (
        <div
          style={{
            marginBottom: "10px",
            textAlign: "center",
            color: "#00ff00",
            fontSize: "16px",
          }}
        >
          <div>
            <strong>Trådtitel:</strong> {threadTitle || "Okänt"}
          </div>
          <div>
            <strong>Antal sidor:</strong> {pageCount}
          </div>
          {estimatedPosts && (
            <div>
              <strong>Inlägg:</strong> ca {estimatedPosts}
            </div>
          )}
        </div>
      )}
      {/* Inställningar för skrapning */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "10px",
          gap: "10px",
          flexWrap: "wrap",
        }}
      >
        <label
          style={{
            flex: "1",
            minWidth: "120px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span style={{ color: "#00ff00", marginBottom: "4px" }}>Skrapa</span>
          <select
            value={scrapeInterval}
            onChange={(e) => setScrapeInterval(e.target.value)}
            style={{
              width: "100%",
              padding: "6px",
              backgroundColor: "#222",
              border: "1px solid #00ff00",
              borderRadius: "4px",
              color: "#00ff00",
              boxSizing: "border-box",
            }}
          >
            <option value="1">Varje sida</option>
            <option value="2">Varannan sida</option>
            <option value="5">Var 5:e sida</option>
            <option value="10">Var 10:e sida</option>
            <option value="50">Var 50:e sida</option>
            <option value="100">Var 100:e sida</option>
            <option value="200">Var 200:e sida</option>
            <option value="500">Var 500:e sida</option>
            <option value="1000">Var 1000:e sida</option>
          </select>
        </label>
        <label
          style={{
            flex: "1",
            minWidth: "120px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span style={{ color: "#00ff00", marginBottom: "4px" }}>
            Max sidor:
          </span>
          <select
            value={maxPages}
            onChange={(e) => setMaxPages(e.target.value)}
            style={{
              width: "100%",
              padding: "6px",
              backgroundColor: "#222",
              border: "1px solid #00ff00",
              borderRadius: "4px",
              color: "#00ff00",
              boxSizing: "border-box",
            }}
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="500">500</option>
            <option value="1000">1000</option>
            <option value="">Alla</option>
          </select>
        </label>
      </div>
      <button
        onClick={handleScrape}
        style={scrapeButtonStyle}
        disabled={isScrapeDisabled}
      >
        {sseActive ? "Skrapar..." : "Skrapa"}
      </button>
    </div>
  );
};

export default ScraperControl;
