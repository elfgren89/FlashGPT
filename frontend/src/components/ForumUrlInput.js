// File: frontend/src/components/ForumUrlInput.js
import React, { useState, useEffect, useRef } from "react";

// Hämta API-bas URL från miljövariabeln
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const ForumUrlInput = ({ value, onChange, placeholder, onSelect }) => {
  const [popularThreads, setPopularThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    // 1. Logga i webbläsarens konsol vad REACT_APP_API_BASE_URL faktiskt är.
    console.log("[ForumUrlInput] REACT_APP_API_BASE_URL =", API_BASE_URL);

    const fetchThreads = async () => {
      setLoading(true);
      try {
        // 2. Logga vilken URL vi anropar innan fetch
        const urlToFetch = `${API_BASE_URL}/popular-threads`;
        console.log("[ForumUrlInput] Fetching popular threads from:", urlToFetch);

        const response = await fetch(urlToFetch);
        const data = await response.json();
        setPopularThreads(data.threads || []);
      } catch (err) {
        console.error(err);
        setError("Fel vid hämtning av populära trådar.");
      } finally {
        setLoading(false);
      }
    };
    fetchThreads();
  }, []);

  // Stäng dropdownen när man klickar utanför
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    onChange(e.target.value);
  };

  const handleThreadSelect = (threadUrl) => {
    onSelect(threadUrl);
    onChange(threadUrl);
    setShowDropdown(false);
  };

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%" }}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        style={{
          width: "100%",
          padding: "12px",
          backgroundColor: "#222",
          border: "none",
          color: "#00ff00",
          fontSize: "16px",
          borderRadius: "4px",
          boxSizing: "border-box",
        }}
        onFocus={() => setShowDropdown(true)}
      />
      <button
        onClick={() => setShowDropdown((prev) => !prev)}
        style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          backgroundColor: "#00ff00",
          border: "none",
          borderRadius: "4px",
          padding: "6px 10px",
          cursor: "pointer",
          color: "#000",
        }}
      >
        ▼
      </button>
      {showDropdown && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            minHeight: "350px",
            width: "100%",
            left: 0,
            right: 0,
            backgroundColor: "#111",
            border: "1px solid #00ff00",
            borderRadius: "4px",
            zIndex: 1000,
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          {loading ? (
            <div style={{ padding: "10px", color: "#00ff00" }}>Hämtar...</div>
          ) : error ? (
            <div style={{ padding: "10px", color: "red" }}>{error}</div>
          ) : (
            <>
              {/* Översta alternativet för manuell inmatning */}
              <div
                style={{
                  padding: "10px",
                  borderBottom: "1px solid #00ff00",
                  cursor: "pointer",
                  color: "#6b6b6b",
                }}
                onClick={() => handleThreadSelect("")}
              >
                {placeholder}
              </div>
              {/* Divider */}
              <div
                style={{
                  padding: "8px",
                  backgroundColor: "#102e0c",
                  borderTop: "2px solid #00ff00",
                  borderBottom: "3px solid #00ff00",
                  textAlign: "center",
                  fontWeight: "bold",
                  color: "#00ff00",
                }}
              >
                Populära ämnen
              </div>
              {popularThreads.map((thread, idx) => (
                <div
                  key={idx}
                  onClick={() => handleThreadSelect(thread.url)}
                  style={{
                    padding: "10px",
                    borderBottom: "1px solid #00ff00",
                    cursor: "pointer",
                    color: "#00ff00",
                  }}
                >
                  <div>
                    <strong>{thread.title}</strong>
                  </div>
                  <div style={{ fontSize: "12px" }}>
                    {thread.category} – {thread.replies} svar, {thread.views} visningar
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ForumUrlInput;
