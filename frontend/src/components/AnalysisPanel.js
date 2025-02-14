/* File: frontend/src/components/AnalysisPanel.js */
import React, { useState, useEffect } from "react";
import TypewriterText from "./TypewriterText";
import Spinner from "./Spinner";

// Helper-funktion som delar upp texten i paragrafer baserat på dubbla radbrytningar
function processParagraphs(text) {
  if (!text || typeof text !== "string") return [];
  return text
    .split(/\n\s*\n/)
    .map(paragraph => paragraph.trim())
    .filter(paragraph => paragraph.length > 0);
}

function AnalysisPanel({ onAnalyze, analysisResult, loadingAnalyze, tokenInfo, posts }) {
  const [question, setQuestion] = useState("");

  const handleAnalyzeClick = () => {
    onAnalyze(question);
  };

  useEffect(() => {
    if (analysisResult) {
      console.log("analysisResult =>", analysisResult);
    }
  }, [analysisResult]);

  return (
    <div style={{
      paddingTop: "10px",
      margin: "30px auto",
      maxWidth: "650px",
      padding: "0px",
      backgroundColor: "#111",
      border: "1px solid #00ff00",
      borderRadius: "8px",
      boxShadow: "0 0 10px #00ff00",
      textAlign: "left",
      fontFamily: "monospace"
    }}>
      <h2 style={{
        marginTop: "0",
        textAlign: "center",
        color: "#00ff00",
        fontSize: "20px"
      }}>
        Analysera Forumtråden
      </h2>

      {/* Token-statistiksektion */}
      {tokenInfo && (
        <div style={{
          backgroundColor: "#222",
          padding: "12px",
          borderRadius: "6px",
          margin: "20px",
          color: "#00ff00",
          fontSize: "15px",
          border: "1px solid #00ff00",
          textAlign: "center"
        }}>
          <h3 style={{ margin: "0 0 8px 0", fontSize: "17px", color: "#00ff00" }}>
            Sammanfattning av skrapade inlägg:
          </h3>
          <p style={{ margin: "5px 0" }}>
            <strong>Totalt antal tecken:</strong> {posts.reduce((acc, p) => acc + p.content.length, 0)}
          </p>
          <p style={{ margin: "5px 0" }}>
            <strong>Uppskattade tokens:</strong> {tokenInfo.tokenCount}
          </p>
        </div>
      )}

      {/* Frågeinput */}
<textarea
  placeholder="Skriv en fråga om innehållet eller lämna tomt för en generell sammanfattning"
  value={question}
  onChange={(e) => setQuestion(e.target.value)}
  style={{
    width: "calc(100% - 40px)", // full width minus horizontal margins
    height: "80px",
    padding: "10px",
    marginLeft: "20px",
    marginRight: "20px",
    backgroundColor: "#222",
    color: "#00ff00",
    border: "1px solid #00ff00",
    borderRadius: "4px",
    fontSize: "15px",
    fontFamily: "monospace",

    boxSizing: "border-box"

  }}
/>
<button
  onClick={handleAnalyzeClick}
  style={{
    width: "calc(100% - 40px)",
    padding: "12px",
    margin: "20px auto", // centered
    fontSize: "16px",
    backgroundColor: "#00ff00",
    color: "#000",
    border: "none",
    borderRadius: "4px",
    fontWeight: "bold",
    display: "block",
    boxSizing: "border-box"
  }}
  disabled={loadingAnalyze}
>
  {loadingAnalyze ? "Analyserar..." : (question.trim() ? "Fråga FlashGPT" : "Analysera forumtråden")}
</button>

      {/* Spinner vid analys */}
      {loadingAnalyze && (
        <div style={{ marginTop: "10px", marginBottom: "10px", textAlign: "center" }}>
          <Spinner />
        </div>
      )}

      {/* Analysresultat med Typewriter-effekt och paragrafuppdelning */}
      {analysisResult && (
        <div style={{
          marginTop: "20px",
          padding: "10px",
          margin: "20px",
          backgroundColor: "#222",
          borderRadius: "6px",
          border: "1px solid #00ff00",
          color: "#00ff00",
          fontSize: "16px",
          lineHeight: "1.6"
        }}>
          <h3 style={{
            textAlign: "center",
            marginBottom: "10px",
            fontSize: "18px",
            textDecoration: "underline"
          }}>
            Analysresultat
          </h3>
          {processParagraphs(analysisResult).map((paragraph, index) => (
            <div key={index} style={{ marginBottom: "10px" }}>
              <TypewriterText text={paragraph} speed={5} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AnalysisPanel;
