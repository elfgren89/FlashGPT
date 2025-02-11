// File: frontend/src/components/ScraperLogStream.js
import React, { useEffect, useState, useRef } from "react";
import "./ScraperLogStream.css"; // Se till att CSS-filen importeras

// Hämta API-bas URL från miljövariabeln
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const ScraperLogStream = ({ forumUrl, interval, maxPages, onResult }) => {
  const [lines, setLines] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const logContainerRef = useRef(null); // Ref för auto-scroll

  useEffect(() => {
    if (isComplete) return; // Avbryt om skrapningen är klar

    const params = new URLSearchParams({ url: forumUrl, interval, maxPages });
    const es = new EventSource(`${API_BASE_URL}/scrape-stream?${params.toString()}`);

    es.onmessage = (event) => {
      setLines((prev) => [...prev, event.data]);
    };

    es.addEventListener("result", (event) => {
      const result = JSON.parse(event.data);
      setLines((prev) => [...prev, "--- Skrapning avslutad ---"]);
      onResult(result);
      setIsComplete(true);
      es.close();
    });

    es.onerror = (err) => {
      if (!isComplete) {
        console.error("SSE error:", err);
        es.close();
      }
    };

    return () => {
      es.close();
    };
  }, [forumUrl, interval, maxPages, onResult, isComplete]);

  // Auto-scroll i loggfönstret
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="scraper-log-container">
      <h2 className="scraper-log-title">Skraplogg</h2>
      <div className="scraper-log-content" ref={logContainerRef}>
        {lines.map((line, idx) => (
          <div key={idx} className="scraper-log-line">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScraperLogStream;
