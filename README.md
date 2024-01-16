# ChatGPT Clone Website

This project is a **ChatGPT clone website** that utilises OpenAi api, AWS RDS. It allows users to register, log in, and engage in conversations with a ChatGPT model. User information and conversations are stored in a MySQL database that can be deleted by user.

## Features

- **User Authentication:** Users can register with the website, log in, and log out securely. Passwords in database are stored after being hashed so there is no visible plain text paswords on the database.
- **Conversation Interface:** Users can engage in conversations with the ChatGPT model through a user-friendly interface.
- **MySQL Database:** User information, including registration details and conversation history, is stored in a MySQL database.
- **OpenAI API Integration:** The website leverages the OpenAI API for natural language processing, allowing users to have meaningful conversations with the ChatGPT model.
- **Delete Conversations:** Users have the ability to delete their conversation history for privacy and data management.
- **Message Restructuring** All incoming messages are being restructured and displayed in a nice and organised manner even code.

## Setup

**Clone repository:**

```
 git clone https://github.com/fac29b/Edgaras-ChatGPT-Clone.git
```

**Install dependencies:**

```
npm install
```

**Establish database connection:**

```
// Create database connection MySQL
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});
```

> [!TIP]
> Store sensative information inside .env file.

**OpenaAI api key:**

- Obtain your secret api key from OpenAI website.
- Store obtained key inside .env file and do not share with anyone.

## Run application

```
node app.js
```

## Access the website

- Visit http://localhost:3000 in your web browser.

## Usage

**Register:**

- Navigate to register page to register new account.
  **Log in:**
- After registration go back to log in page and use the same credentials you just used to register your account.
  **Have a conversation:**
- Now you can have conversations with ChatGPT.
  **Log out:**
- When done you can just log out.

## Disclaimer

This project is solely for educational purposes, and the use of the OpenAI API is subject to OpenAI's terms and conditions. Please review and comply with OpenAI's usage policies.
