// Import required modules
const express = require("express");
const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");

// Example SSL key and certificate (Replace with your actual key and cert files)
const key = fs.readFileSync(path.join(__dirname, "server.key"));
const cert = fs.readFileSync(path.join(__dirname, "server.cert"));
const credentials = { key, cert };

// Initialize the Express app
const app = express();

// Middleware example: JSON parsing (Global middleware)
app.use(express.json()); // Automatically parses JSON request bodies

// Route-specific middleware
app.use("/api", (req, res, next) => {
  console.log("API request received");
  next();
});

// Example Route: GET /
app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to the homepage!" });
});

// Example Route: POST /api/data
app.post("/api/data", (req, res) => {
  const { name, age } = req.body;
  if (!name || !age) {
    return res.status(400).json({ message: "Name and age are required!" });
  }
  res.status(201).json({ message: "Data received successfully", data: { name, age } });
});

// Global Error Middleware (Express built-in error handler)
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: err,
  });
});

// HTTP Server
const httpServer = http.createServer(app);

// HTTPS Server (Requires SSL key and certificate)
const httpsServer = https.createServer(credentials, app);

// Start the HTTP Server
httpServer.listen(3000, () => {
  console.log("HTTP Server is running on port 3000");
});

// Start the HTTPS Server (if credentials are available)
if (key && cert) {
  httpsServer.listen(3443, () => {
    console.log("HTTPS Server is running on port 3443");
  });
}

// Handling signals for graceful shutdown (for production readiness)
process.on("SIGINT", () => {
  console.log("Shutting down gracefully...");
  httpServer.close(() => {
    console.log("HTTP server stopped");
  });
  httpsServer.close(() => {
    console.log("HTTPS server stopped");
  });
});

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Testing HTTP and HTTPS with route
app.get("/test", (req, res) => {
  res.send("Test endpoint reachable via both HTTP and HTTPS");
});

// File serving example (static assets)
app.use("/static", express.static(path.join(__dirname, "public")));

// Example: Graceful shutdown implementation for HTTPS/HTTP servers
const closeServers = () => {
  console.log("Closing servers...");
  httpServer.close(() => console.log("HTTP server closed."));
  httpsServer.close(() => console.log("HTTPS server closed."));
};

// Handling uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  closeServers();
  process.exit(1); // Exit with failure
});

// Handling unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled promise rejection:", reason);
  closeServers();
  process.exit(1); // Exit with failure
});
