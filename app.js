require("dotenv").config();
//
const bcrypt = require("bcrypt");
//
const express = require("express");
const session = require("express-session");
//
const { generateResponse } = require("./openaiIntegration");
//
const mysql = require("mysql2/promise");
//
const ejs = require("ejs");
//
const app = express();
const port = 3000;
//
app.set("view engine", "ejs");

//
// Create database connection
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

// Use the session middleware
app.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: true,
  })
);

// Serve HTML page
app.get("/", (req, res) => {
  res.render("login");
});

// Serve CSS style
app.get("/login.css", (req, res) => {
  res.sendFile(__dirname + "/login.css", {
    headers: { "Content-type": "text/css" },
  });
});

// Serve JavaScript
app.get("/login.js", (req, res) => {
  res.sendFile(__dirname + "/login.js", {
    headers: { "Content-type": "application/javascript" },
  });
});

// Serve JavaScript
app.get("/globalvariables.js", (req, res) => {
  res.sendFile(__dirname + "/globalvariables.js", {
    headers: { "Content-type": "application/javascript" },
  });
});

// Handle login form submission
app.post("/", express.json(), async (req, res) => {
  const { username, password } = req.body;
  try {
    const [result] = await pool.execute(
      "SELECT username, password_hash FROM users WHERE username = ?",
      [username]
    );
    // Check if a user was found
    let storedHashedPassword = "";

    if (result[0] && result[0].password_hash !== undefined) {
      storedHashedPassword = result[0].password_hash;
    }

    // Compare the entered password with the stored hashed password
    const passwordMatch = await bcrypt.compare(password, storedHashedPassword);

    if (passwordMatch) {
      // Set isAuthenticated session variable to true upon successful login
      req.session.isAuthenticated = true;
      // Store the username in the session
      req.session.username = username;

      // Send a JSON response to the client with success details
      res.json({
        success: true,
        redirectUrl: "/home",
      });
      console.log("User logged in successfully:", result);
    } else {
      // Send a JSON response to the client with login failure details
      res.status(401).json({
        success: false,
        error: "Invalid username or password",
      });
    }
  } catch (error) {
    console.log("Error log in user", error);

    // Send a JSON response to the client with error details
    res.status(500).json({
      success: false,
      errorCode: error.code,
    });
  }
});

app.post("/register", express.json(), async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      "INSERT INTO users (username, password_hash) VALUES (?, ?)",
      [username, hashedPassword]
    );

    // Send a JSON response to the client with error details
    res.json({
      success: true,
    });
    console.log("User registered successfully:", result);
  } catch (error) {
    console.log("Error registering user", error);

    // Send a JSON response to the client with error details
    res.status(500).json({
      success: false,
      errorCode: error.code,
    });
  }
});

// Add this route in your Express app
app.get("/register", (req, res) => {
  res.render("register");
});

// Serve JavaScript
app.get("/register.js", (req, res) => {
  res.sendFile(__dirname + "/register.js", {
    headers: { "Content-type": "application/javascript" },
  });
});

// Serve HTML page
app.get("/home", (req, res) => {
  // Check if the user is authenticated
  if (req.session && req.session.isAuthenticated) {
    // User is authenticated, render the home page
    res.render("index");
  }
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

// Logout
app.get("/logout", (req, res) => {
  // Destroy the user session to log them out
  req.session.destroy((err) => {
    if (err) {
      console.error("Error during logout:", err);
    }
    // Redirect to the login page after logout
    res.redirect("/");
  });
});

// Receive message from user
app.post("/submit", express.json(), async (req, res) => {
  const message = req.body.message;
  let crrntConversationId = req.body.currentConversationId;
  // Stringify message before storing into database
  const userMessageObject = JSON.stringify({ role: "user", content: message });
  // Cut begginning of the mesage to store it as conversation topic in database
  const conversationTopic = `${message.slice(0, 15)}...`;

  try {
    // Retrieve user
    const [userData] = await pool.execute(
      "SELECT * FROM users WHERE username = ?",
      [req.session.username]
    );
    // Check if conversation already exist
    const [existingConversation] = await pool.execute(
      `
      SELECT * FROM conversations WHERE id = ? AND user_id = ?
      `,
      [crrntConversationId, userData[0].id]
    );
    // Add conversation to database if it doesn't exist
    if (existingConversation.length === 0) {
      // Insert conversation topic to specific user
      const [conversationResponse] = await pool.execute(
        `
      INSERT INTO conversations (user_id, conversation) VALUES (?,?)`,
        [userData[0].id, conversationTopic]
      );

      // Insert message info to specific user
      const [messageResponse] = await pool.execute(
        `
      INSERT INTO messages (conversation_id, sender_id, message_text) VALUES (?,?,?)`,
        [conversationResponse.insertId, userData[0].id, userMessageObject]
      );
      crrntConversationId = conversationResponse.insertId;
      console.log("New Current conversation ID: ", crrntConversationId);
    } else {
      console.log("Existing Current conversation ID: ", crrntConversationId);
      // Insert message info to specific user
      const [messageResponse] = await pool.execute(
        `
        INSERT INTO messages (conversation_id, sender_id, message_text)
        VALUES (?, ?, ?)
        `,
        [crrntConversationId, userData[0].id, userMessageObject]
      );
    }
    // Retrieve updated conversation

    // Retrieve user conversations
    const [conversations] = await pool.execute(
      "SELECT * FROM conversations WHERE user_id = ?",
      [userData[0].id]
    );

    // Retrieve user messages
    const updatedConversation = [];
    for (const conversation of conversations) {
      const [conversationMessages] = await pool.execute(
        "SELECT message_text FROM messages WHERE conversation_id = ?",
        [conversation.id]
      );
      updatedConversation.push(...conversationMessages);
    }

    const parsedMessages = [];
    for (const messageObject of updatedConversation) {
      const parsedMessage = JSON.parse(messageObject.message_text);
      parsedMessages.push(parsedMessage);
      console.log(parsedMessage);
      console.log(messageObject.message_text);
    }
    console.log(parsedMessages);
    // openai response
    const openaiResponse = await generateResponse(parsedMessages);
    console.log(openaiResponse);

    if (openaiResponse) {
      // Insert message info to specific user
      const [messageResponse] = await pool.execute(
        `
        INSERT INTO messages (conversation_id, sender_id, message_text)
        VALUES (?, ?, ?)
        `,
        [
          crrntConversationId,
          userData[0].id,
          JSON.stringify({ role: "assistant", content: openaiResponse }),
        ]
      );
    }

    // Send information to client
    res.json({
      openaiResponse: openaiResponse,
      conversationTopic: conversationTopic,
      conversationId: crrntConversationId,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).send(`Internal Server Error: ${error.message}`);
  }
});

// Retrieve user data
app.post("/retrieveData", express.json(), async (req, res) => {
  try {
    // Retrieve user
    const [userData] = await pool.execute(
      "SELECT * FROM users WHERE username = ?",
      [req.session.username]
    );

    // Retrieve user conversations
    const [conversations] = await pool.execute(
      "SELECT * FROM conversations WHERE user_id = ?",
      [userData[0].id]
    );

    // Retrieve user messages
    const messages = [];
    for (const conversation of conversations) {
      const [conversationMessages] = await pool.execute(
        "SELECT * FROM messages WHERE conversation_id = ?",
        [conversation.id]
      );
      messages.push({
        conversationId: conversation.id,
        messages: conversationMessages,
      });
    }
    console.log(messages);
    // Data to be sent to clien side
    const dataForClient = {
      user: userData[0],
      conversations: conversations,
      messages: messages,
    };

    console.log(userData[0]);
    //console.log(messages[0].messages);
    console.log("Database data retrieved");

    // Send a JSON response to the client with success details
    res.json({
      success: true,
      userData: dataForClient,
    });
    console.log("Data sent successfully:");
  } catch (error) {
    console.log("Error data", error);

    // Send a JSON response to the client with error details
    res.status(500).json({
      success: false,
      errorCode: error.code,
    });
  }
});

// Retrieve user data
app.post("/retrieveConversation", express.json(), async (req, res) => {
  try {
    // Retrieve user
    const [userData] = await pool.execute(
      "SELECT * FROM users WHERE username = ?",
      [req.session.username]
    );

    // Retrieve user conversations
    const [conversations] = await pool.execute(
      "SELECT * FROM conversations WHERE user_id = ?",
      [userData[0].id]
    );

    // Retrieve user
    const messages = [];
    for (const conversation of conversations) {
      const [conversationMessages] = await pool.execute(
        "SELECT * FROM messages WHERE conversation_id = ?",
        [req.body.conversationId]
      );
      messages.push({
        conversationId: conversation.id,
        messages: conversationMessages,
      });
    }
    // Data to be sent to clien side
    const dataForClient = {
      user: userData[0],
      conversations: conversations,
      messages: messages,
    };

    console.log(userData[0]);
    console.log(conversations);
    if (typeof messages[0].messages !== "undefined") {
      console.log(messages[0].messages);
    }
    console.log("Conversation data retrieved");

    // Send a JSON response to the client with success details
    res.json({
      success: true,
      userData: dataForClient,
    });
    console.log("Conversation data sent successfully");
  } catch (error) {
    console.log("Error data", error);

    // Send a JSON response to the client with error details
    res.status(500).json({
      success: false,
      errorCode: error.code,
    });
  }
});

// Delete conversations and messages
app.post("/delete", express.json(), async (req, res) => {
  try {
    // Delete user conversations and messages
    const [userData] = await pool.execute(
      "SELECT * FROM users WHERE username = ?",
      [req.session.username]
    );

    const [deleteMessages] = await pool.execute(
      `DELETE FROM messages 
      WHERE sender_id = ? AND conversation_id = ?`,
      [userData[0].id, req.body.conversationId]
    );

    const [deleteConversations] = await pool.execute(
      `DELETE FROM conversations 
      WHERE user_id = ? AND id = ?`,
      [userData[0].id, , req.body.conversationId]
    );

    // Send a JSON response to the client with success details
    res.json({
      converId: req.body.conversationId,
    });
    console.log(
      "User conversation and messages deleted id:",
      req.body.conversationId
    );
  } catch (error) {
    console.error("Error deleting conversations and messages", error);
  }
});
// Start server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
