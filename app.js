const express = require("express");
const app = express();
const port = 3000;

// Serve HTML page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Serve CSS style
app.get("/styles.css", (req, res) => {
  res.sendFile(__dirname + "/styles.css", {
    headers: { "Content-type": "text/css" },
  });
});

// Serve JavaScript
app.get("/index.js", (req, res) => {
  res.sendFile(__dirname + "/index.js", {
    headers: { "Content-type": "application/javascript" },
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
