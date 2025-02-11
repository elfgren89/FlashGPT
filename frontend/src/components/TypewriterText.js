/* File: frontend/src/components/TypewriterText.js */
import React, { useEffect, useState, useRef } from "react";

// Custom markdown-to-HTML converter that:
// 1. Splits the text into lines.
// 2. If a line starts with "*" and ends with ":", it’s treated as a header and rendered as bold.
// 3. Lines starting with "*" (that don't end with ":") are treated as bullet items.
// 4. Other lines are wrapped in <p> tags.
// 5. Converts **bold** to <strong> and *italic* to <em>.
function markdownToHtml(text) {
  if (!text) return "";
  const lines = text.split("\n");
  let htmlLines = [];
  let listBuffer = [];

  const flushList = () => {
    if (listBuffer.length) {
      htmlLines.push("<ul>" + listBuffer.join("") + "</ul>");
      listBuffer = [];
    }
  };

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    // Check for header written as **Header:**
    const headerMatch = trimmedLine.match(/^\*\*(.+:)\*\*$/);
    if (headerMatch) {
      flushList();
      const headerText = headerMatch[1].trim();
      htmlLines.push(`<p><strong>${headerText}</strong></p>`);
    }
    // Otherwise, if the line starts with "*" and ends with ":", treat it as a header.
    else if (trimmedLine.startsWith("*") && trimmedLine.endsWith(":")) {
      flushList();
      const headerText = trimmedLine
        .replace(/^\*\s*/, "") // remove leading asterisk and spaces
        .replace(/\*+$/, "")   // remove trailing asterisks if any
        .trim();
      htmlLines.push(`<p><strong>${headerText}</strong></p>`);
    }
    // If the line starts with "*" (but not ending with ":"), treat it as a bullet item.
    else if (trimmedLine.startsWith("*")) {
      const listItemText = trimmedLine
        .replace(/^\*\s*/, "")
        .replace(/\*+$/, "")
        .trim();
      const listItem = `<li>${listItemText}</li>`;
      listBuffer.push(listItem);
    } else {
      flushList();
      if (trimmedLine) {
        htmlLines.push(`<p>${trimmedLine}</p>`);
      }
    }
  });
  flushList();

  let html = htmlLines.join("");
  // Convert any remaining **bold** markers to <strong>
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  // Convert any remaining *italic* markers to <em>
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  return html;
}

const TypewriterText = ({ text, speed = 5 }) => {
  const [displayedText, setDisplayedText] = useState("");
  const currentIndex = useRef(0);
  const timerRef = useRef(null);
  const stableText = useRef("");

  useEffect(() => {
    setDisplayedText("");
    currentIndex.current = 0;
    const cleanText = typeof text === "string" ? text : "";
    if (!cleanText) return;
    stableText.current = cleanText;
    
    const tick = () => {
      if (currentIndex.current < stableText.current.length) {
        const nextChar = stableText.current[currentIndex.current] || "";
        setDisplayedText(prev => prev + nextChar);
        currentIndex.current++;
        timerRef.current = setTimeout(tick, speed);
      }
    };

    timerRef.current = setTimeout(tick, speed);
    return () => clearTimeout(timerRef.current);
  }, [text, speed]);

  // Always process the current displayed text via markdownToHtml so formatting is applied in real time.
  const htmlContent = markdownToHtml(displayedText);
  return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
};

export default TypewriterText;
