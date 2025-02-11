/* File: frontend/src/components/ForumThread.js */
import React from "react";
import Post from "./Post";

function ForumThread({ posts }) {
  return (
    <div style={{ marginBottom: "30px", textAlign: "left" }}>
      <h2>Hämtade Inlägg:</h2>
      <div>
        {posts.map((post, index) => (
          <Post key={index} post={post} />
        ))}
      </div>
    </div>
  );
}

export default ForumThread;
