/* File: frontend/src/components/Spinner.js */
import React from "react";

const spinnerStyle = {
  margin: "0 auto",
  border: "4px solid #333",
  borderTop: "4px solid #00ff00",
  borderRadius: "50%",
  width: "30px",
  height: "30px",
  animation: "spin 1s linear infinite"
};

const Spinner = () => {
  return <div style={spinnerStyle}></div>;
};

export default Spinner;
