// File: frontend/src/components/PopularThreadsDropdown.js
import React, { useEffect, useState } from "react";

// Hämta API-bas URL från miljövariabeln
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const PopularThreadsDropdown = ({ onSelect }) => {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchThreads = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/popular-threads`);
        const data = await response.json();
        setThreads(data.threads || []);
      } catch (err) {
        console.error(err);
        setError("Fel vid hämtning av populära trådar.");
      } finally {
        setLoading(false);
      }
    };
    fetchThreads();
  }, []);

  const handleChange = (e) => {
    const selectedUrl = e.target.value;
    onSelect(selectedUrl);
  };

  return (
    <div style={{ margin: "20px auto", maxWidth: "650px", minHeight: "650px", color: "#00ff00", fontFamily: "monospace" }}>
      <label>
        Välj en populär tråd:
        {loading ? (
          <span> Hämtar...</span>
        ) : error ? (
          <span style={{ color: "red" }}> {error}</span>
        ) : (
          <select
            onChange={handleChange}
            style={{
              marginLeft: "10px",
              padding: "6px",
              backgroundColor: "#222",
              color: "#00ff00",
              border: "1px solid #00ff00",
              borderRadius: "4px",
            }}
          >
            <option value="">-- Välj tråd --</option>
            {threads.map((thread, idx) => (
              <option key={idx} value={thread.url}>
                {thread.title} ({thread.category}) – ca {thread.replies} svar, {thread.views} visningar
              </option>
            ))}
          </select>
        )}
      </label>
    </div>
  );
};

export default PopularThreadsDropdown;
