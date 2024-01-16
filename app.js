// Require for save variable storage and usage
require("dotenv").config();
// Used to encrypt user password
const bcrypt = require("bcrypt");
// Networking
const express = require("express");
// Store user session information
const session = require("express-session");
// Used to generate secure userId
const { v4: uuidv4 } = require("uuid");
// Retrieves openai response function that return response
const { generateResponse } = require("./openaiIntegration");
// Database MySQL
const mysql = require("mysql2/promise");
// Initiate express.js
const app = express();
// Port for testing for deployment change to port:80
const port = 3000;
// (configuration: view engine, specify that we will use: ejs )
app.set("view engine", "ejs");

// Create database connection MySQL
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

// Use middleware for seesion support
// User session data will be stored on the server side
// Session Id cookie will be used to match user client with their session
app.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: true,
  })
);

// Serve login.ejs
app.get("/", (req, res) => {
  res.render("login");
});

// Serve styles.css
app.get("/login.css", (req, res) => {
  res.sendFile(__dirname + "/login.css", {
    headers: { "Content-type": "text/css" },
  });
});

// Serve login.js
app.get("/login.js", (req, res) => {
  res.sendFile(__dirname + "/login.js", {
    headers: { "Content-type": "application/javascript" },
  });
});

// Handle login form submission
app.post("/", express.json(), async (req, res) => {
  const { username, password } = req.body;

  // Check if the user already have a session activated
  // Multiple log ins not supported on the same browser
  // User must use different browser window to log in wiht multiple accounts
  if (req.session.isAuthenticated) {
    return res.status(403).json({
      success: false,
      error:
        "User instance found on this browser. Use different browser window to log in with multiple accounts.",
    });
  }

  try {
    // Check database for the user using username provided
    const [result] = await pool.execute(
      "SELECT username, password_hash FROM users WHERE username = ?",
      [username]
    );
    // Store hashed password from the database if the user was found
    const storedHashedPassword = result[0]?.password_hash || "";

    // Compare entered password with the stored hashed password from database
    const passwordMatch = await bcrypt.compare(password, storedHashedPassword);

    // If password match run code below if not go down to else statement
    if (passwordMatch) {
      // Generate a unique user ID (session ID) using uuid
      const userId = uuidv4();

      // Set isAuthenticated session variable to true upon successful login
      req.session.isAuthenticated = true;

      // Store the user ID in the session
      req.session.userId = userId;

      // Set the username
      req.session.username = username;

      // Send response to the client with success: true and redirectUrl: "/home"
      res.json({
        success: true,
        redirectUrl: "/home",
      });
      // Console.log to terminal
      console.log("User logged in successfully:", result);
    } else {
      // Send a JSON response to the client with login failure details
      res.status(401).json({
        success: false,
        error: "Invalid Username or Password.",
      });
    }
  } catch (error) {
    console.log("Error log in user", error);
    // Send a JSON response to the client with error details
    res.status(500).json({
      success: false,
      error: error.code,
    });
  }
});

// Handle registration submission
app.post("/register", express.json(), async (req, res) => {
  // Store received Username and Password into variable
  const { username, password } = req.body;
  try {
    // Hash user given password to be stored in database
    const hashedPassword = await bcrypt.hash(password, 10);
    // Insert new users information into database
    const [result] = await pool.execute(
      "INSERT INTO users (username, password_hash) VALUES (?, ?)",
      [username, hashedPassword]
    );

    // Send a JSON response to the client with success: true and a message
    res.json({
      success: true,
      message: "Registration successful you can log in now.",
    });
    // Console.log to terminal
    console.log("User registered successfully:", result);
  } catch (error) {
    // Console.log to terminal
    console.log("Error registering user", error);

    // Send a JSON response to the client with error details
    res.status(500).json({
      success: false,
      error: error.errno,
    });
  }
});

// Serve register.ejs
app.get("/register", (req, res) => {
  res.render("register");
});

// Serve register.js
app.get("/register.js", (req, res) => {
  res.sendFile(__dirname + "/register.js", {
    headers: { "Content-type": "application/javascript" },
  });
});

// Serve index.ejs
app.get("/home", (req, res) => {
  // Check if the user is authenticated
  if (req.session && req.session.isAuthenticated) {
    // If user authenticated render index.ejs
    res.render("index");
  }
});

// Serve styles.css
app.get("/styles.css", (req, res) => {
  res.sendFile(__dirname + "/styles.css", {
    headers: { "Content-type": "text/css" },
  });
});

// Serve index.js
app.get("/index.js", (req, res) => {
  res.sendFile(__dirname + "/index.js", {
    headers: { "Content-type": "application/javascript" },
  });
});

// Handle user logout
app.get("/logout", (req, res) => {
  // Destroy the user session cookie
  req.session.destroy((err) => {
    if (err) {
      console.error("Error during logout:", err);
    }
    // Redirect to the login page after logout
    res.redirect("/");
  });
});

// Handle incoming user messages
app.post("/submit", express.json(), async (req, res) => {
  // Retrieve incoming message
  const message = req.body.message;
  // Retrieve conversation id
  let crrntConversationId = req.body.currentConversationId;
  // Stringify message before storing into database
  const userMessageObject = JSON.stringify({ role: "user", content: message });
  // Slice begginning of the mesage to store it as conversation topic in database
  const conversationTopic = `${message.slice(0, 25)}...`;

  try {
    // Retrieve user from database using username
    const [userData] = await pool.execute(
      "SELECT * FROM users WHERE username = ?",
      [req.session.username]
    );
    // Check if conversation already exist in database
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
      // Store new conversation id to later pass to client
      crrntConversationId = conversationResponse.insertId;
      // Console.log New current conversation id
      console.log("New Current conversation ID: ", crrntConversationId);
    } else {
      // Console.log Existing conversation id
      console.log("Existing Current conversation ID: ", crrntConversationId);
      // Insert into messages conversation id, user id and message itself
      const [messageResponse] = await pool.execute(
        `
        INSERT INTO messages (conversation_id, sender_id, message_text)
        VALUES (?, ?, ?)
        `,
        [crrntConversationId, userData[0].id, userMessageObject]
      );
    }

    // Retrieve user conversations
    const [conversations] = await pool.execute(
      "SELECT * FROM conversations WHERE user_id = ?",
      [userData[0].id]
    );

    // Retrieve user messages where conversation id mathes in the database
    // Store retrieved messages into array
    const [conversationMessages] = await pool.execute(
      "SELECT message_text FROM messages WHERE conversation_id = ?",
      [crrntConversationId]
    );

    // Parse retrieved messages to be sent off to openai api
    const parsedMessages = [];
    for (const messageObject of conversationMessages) {
      const parsedMessage = JSON.parse(messageObject.message_text);
      parsedMessages.push(parsedMessage);
    }
    // OpenAI response after sending it parsed messages
    const openaiResponse = await generateResponse(parsedMessages);
    console.log(openaiResponse);

    if (openaiResponse) {
      // Insert OpenAI message response database
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

    // Send retrieved information back to the client
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
    // Data to be sent to clien side
    const dataForClient = {
      username: userData[0].username,
      conversations: conversations,
      messages: messages,
    };

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

// Retrieve User conversations
app.post("/retrieveConversation", express.json(), async (req, res) => {
  try {
    // Retrieve user data from database
    const [userData] = await pool.execute(
      "SELECT * FROM users WHERE username = ?",
      [req.session.username]
    );

    // Retrieve user conversations from database
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
      user: userData[0].username,
      conversations: conversations,
      messages: messages,
    };

    console.log("Conversation data retrieved");

    // Send a JSON response to the client with success details
    res.json({
      success: true,
      userData: dataForClient,
    });
    console.log("Conversation data sent successfully");
  } catch (error) {
    console.log("Error data", error);
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
