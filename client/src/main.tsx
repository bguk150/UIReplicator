import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");

// Enhanced error handling for React initialization
if (!rootElement) {
  // Create a root element if it doesn't exist
  const fallbackRoot = document.createElement("div");
  fallbackRoot.id = "root";
  document.body.appendChild(fallbackRoot);
  
  console.error("Root element not found, created fallback element");
  
  // Attempt to render with fallback element
  try {
    createRoot(fallbackRoot).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (error) {
    console.error("Failed to render app:", error);
    
    // Display a user-friendly error message
    fallbackRoot.innerHTML = `
      <div style="font-family: sans-serif; padding: 20px; text-align: center;">
        <h1>Beyond Grooming</h1>
        <p>We're experiencing technical difficulties. Please try reloading the page.</p>
        <button onclick="window.location.reload()">Reload Now</button>
      </div>
    `;
  }
} else {
  // Normal initialization
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
    
    console.log("App successfully mounted");
  } catch (error) {
    console.error("Error rendering app:", error);
    
    // Display error message in the existing root element
    rootElement.innerHTML = `
      <div style="font-family: sans-serif; padding: 20px; text-align: center;">
        <h1>Beyond Grooming</h1>
        <p>We're experiencing technical difficulties. Please try reloading the page.</p>
        <button onclick="window.location.reload()">Reload Now</button>
      </div>
    `;
  }
}
