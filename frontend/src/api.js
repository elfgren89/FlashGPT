// File: frontend/src/api.js
import axios from "axios";

// Använd miljövariabeln. Se till att du har skapat en .env-fil med REACT_APP_API_BASE_URL.
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

export async function scrapeForum(url, interval, maxPages) {
  const params = { url, interval };
  if (maxPages) params.maxPages = maxPages;
  const response = await axios.get(`${API_BASE_URL}/scrape`, { params });
  return response.data;
}

export async function analyzeTextAPI(text, question = "") {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json;charset=utf-8" },
    body: JSON.stringify({ text, question }),
  });
  
  const data = await response.json();
  
  if (!data.result) {
    throw new Error(data.error || "Inget analysresultat returnerades");
  }
  
  return data.result;
}
