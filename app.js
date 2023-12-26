require("dotenv").config();

const express = require("express");

const { generateResponse } = require("./openaiIntegration");

const ejs = require("ejs");

const app = express();
const port = 3000;

app.set("view engine", "ejs");

// Serve HTML page
app.get("/", (req, res) => {
  res.render("index");
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

// Receive message from user
app.post("/submit", express.json(), async (req, res) => {
  const message = req.body.message;
  console.log("Received message from client:", message);
  try {
    const openaiResponse = await generateResponse(message);
    console.log(openaiResponse);

    // Split the response into paragraphs
    const paragraphs = openaiResponse.split("\n\n");
    console.log(paragraphs);

    // Check each paragraph and format as code if it starts with a certain marker
    const formattedParagraphs = paragraphs.map((paragraph) => {
      if (paragraph.trim().startsWith("```")) {
        return `<pre style="background-color: black;"><code>${paragraph
          .trim()
          .slice(3)}</code></pre>`;
      } else if (paragraph.trim().endsWith("```")) {
        return `<pre><code>${paragraph
          .trim()
          .slice(paragraph.length - 3, -3)}</code></pre>`;
      } else {
        return `<p>${paragraph}</p>`;
      }
    });

    // Join the formatted paragraphs back together
    const formattedResponse = formattedParagraphs.join("");

    res.json({ openaiResponse: formattedResponse });
  } catch (error) {
    res.status(500).send(`Internal Server Error: ${error}`);
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
