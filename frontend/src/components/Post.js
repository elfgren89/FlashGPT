/* File: frontend/src/components/Post.js */
import React, { useState } from "react";

function Post({ post }) {
  const [expanded, setExpanded] = useState(false);
  const toggleExpanded = () => setExpanded(!expanded);
  const previewLength = 200;
  const contentPreview = post.content.length > previewLength
    ? post.content.substring(0, previewLength) + "..."
    : post.content;

  return (
    <div style={{
      margin: "0 auto",
      maxWidth: "630px",
      border: "1px solid #00ff00",
      padding: "10px",
      marginBottom: "10px",
      backgroundColor: "#111",
      borderRadius: "4px"
    }}>
      <strong>Inlägg {post.postNumber} (Sida {post.page})</strong>
      <p style={{ whiteSpace: "pre-wrap" }}>
        {expanded ? post.content : contentPreview}
      </p>
      {post.content.length > previewLength && (
        <button
          onClick={toggleExpanded}
          style={{
            padding: "4px 8px",
            backgroundColor: "#00ff00",
            color: "#000",
            border: "none",
            borderRadius: "4px",
            marginTop: "8px"
          }}
        >
          {expanded ? "Visa mindre" : "Visa mer"}
        </button>
      )}
    </div>
  );
}

export default Post;
