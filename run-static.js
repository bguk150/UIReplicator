// This script builds and runs the static server
import { execSync } from "child_process";
import { spawn } from "child_process";
import { existsSync, mkdirSync } from "fs";
import path from "path";

// Make sure dist directory exists
const distDir = path.resolve("dist");
const publicDir = path.resolve(distDir, "public");

if (!existsSync(distDir)) {
  console.log("Creating dist directory...");
  mkdirSync(distDir, { recursive: true });
}

if (!existsSync(publicDir)) {
  console.log("Creating dist/public directory...");
  mkdirSync(publicDir, { recursive: true });
}

console.log("Starting build process...");
try {
  // Build the client application
  console.log("Building client with vite...");
  execSync("npm run build", { stdio: "inherit" });
  
  // Build the static server
  console.log("Building static server with esbuild...");
  execSync("esbuild server/static-server.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/static-server.js", { stdio: "inherit" });
  
  console.log("Build completed successfully!");
} catch (error) {
  console.error("Build failed:", error);
  process.exit(1);
}

// Set production environment
process.env.NODE_ENV = "production";

console.log("Starting static server in production mode...");
// Start the static server with production environment
const server = spawn("node", ["dist/static-server.js"], {
  env: { ...process.env, NODE_ENV: "production" },
  stdio: "inherit"
});

server.on("error", (error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});

server.on("exit", (code) => {
  if (code !== 0) {
    console.error(`Server exited with code ${code}`);
    process.exit(code || 1);
  }
});

// Handle process termination
process.on("SIGINT", () => {
  console.log("Shutting down server...");
  server.kill("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Shutting down server...");
  server.kill("SIGTERM");
  process.exit(0);
});