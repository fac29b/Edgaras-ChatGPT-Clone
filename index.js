const conversationContainer = document.getElementById("conversationContainer");
const conversationMenuContainer = document.querySelector(".left-menu-options");

window.onload = function () {
  RetrieveUserData();
};

let currentConversationId = -1; // Default value might need to change

function TogglePopUp() {
  const popUpMenu = document.querySelector(".popup-menu");
  popUpMenu.classList.toggle("popup-menu-toggle");
}

function toggle() {
  const menuBtnToggle = document.querySelector(".toggle-left-menu-button");
  menuBtnToggle.classList.toggle("left-menu-toggle-button-transition");
  const menuToggle = document.querySelector(".left-menu-container");
  menuToggle.classList.toggle("left-menu-closed");
}

document.addEventListener("click", function (event) {
  const clickedButton = event.target.closest(".nested-chat-btn");
  const isMenu = event.target.closest(".nested-btn-menu");

  if (!clickedButton && !isMenu) {
    closeAllMenusExcept(null);
  }
});

function toggleNestedMenu(button) {
  const menu = button.parentElement.querySelector(".nested-btn-menu");

  if (menu.style.display === "block") {
    menu.style.display = "none";
  } else {
    // Hide all other menus
    closeAllMenusExcept(menu);

    const rect = button.getBoundingClientRect();
    menu.style.top = rect.bottom + "px";
    menu.style.left = rect.left + "px";
    menu.style.display = "block";
  }
}

function closeAllMenusExcept(exceptMenu) {
  const allMenus = document.querySelectorAll(".nested-btn-menu");
  allMenus.forEach(function (menu) {
    if (menu !== exceptMenu && menu.style.display === "block") {
      menu.style.display = "none";
    }
  });
}

// When conversation doesn't fit anymore on the page scroll down
function ScrollDownConversation() {
  const conversationArea = document.getElementById("conversationContainer");
  conversationArea.scrollTop = conversationArea.scrollHeight;
}

// Display first letter of the username as a username logo
function DisplayUserLogo() {
  const firstUsernameLetter = document.getElementById("username");
  return firstUsernameLetter.textContent[0];
}

// Highlight active conversation
function HighlightConversation(conversationId) {
  const allConversationBtns = document.querySelectorAll(".chat-btn");
  const allNestedButtons = document.querySelectorAll(".nested-chat-btn");
  const btnChild = document.getElementById(conversationId);

  // Remove the class from all conversation buttons
  allConversationBtns.forEach((btn) => {
    btn.classList.remove("chat-btn-focus");
  });

  // Remove the class from all nested buttons
  allNestedButtons.forEach((nestedBtn) => {
    nestedBtn.classList.remove("nested-chat-btn-focus");
  });

  // Check if user pressed on new conversation btn Default -1;
  if (conversationId === -1) return;

  btnChild.parentElement.classList.add("chat-btn-focus");

  const nextButton = btnChild.parentElement.nextElementSibling;

  // Add a class to the next sibling button if it exists
  if (nextButton && nextButton.classList.contains("nested-chat-btn")) {
    nextButton.classList.add("nested-chat-btn-focus");
  }
}

function handleEnterKey(event) {
  if (event.keyCode === 13 && !event.shiftKey) {
    submitForm();
    return false;
  }
  return true;
}

// Send message
async function sendMessage(message) {
  const response = await fetch("/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, currentConversationId }),
  });

  if (response.ok) {
    const result = await response.json();
    RemoveAiReasponseLoding();
    UpdateConversation(result.openaiResponse, "ChatGPT");
    if (currentConversationId !== result.conversationId) {
      AddConversation(result.conversationTopic, result.conversationId);
    }
  } else {
    console.error(
      "Failed to send message:",
      response.status,
      response.statusText
    );
  }
}

// Retrieve userdata
async function RetrieveUserData() {
  const response = await fetch("/retrieveData", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  if (response.ok) {
    const result = await response.json();
    console.log(result);
    InsertUsername(result.userData);
    OnLoadAddConversation(result.userData);
  } else {
    console.error(
      "Failed to send message:",
      response.status,
      response.statusText
    );
  }
}

function InsertUsername(username) {
  const usernameId = document.getElementById("username");
  const usernameFirstLetter = document.getElementById("user-first-letter");
  usernameFirstLetter.textContent = username.username[0];
  usernameId.textContent = username.username;
}

function OnLoadAddConversation(data) {
  if (data.conversations.length === 0) {
    return;
  }
  currentConversationId = data.conversations[data.conversations.length - 1].id;
  for (const conver in data.conversations) {
    conversationMenuContainer.insertAdjacentHTML(
      "afterbegin",
      `<div class="chat-btn-container" id="${data.conversations[conver].id}delete">
      <button class="chat-btn" onclick="SelectConversation(${data.conversations[conver].id})">
        <a id="${data.conversations[conver].id}">${data.conversations[conver].conversation}</a>
        <button class="nested-chat-btn" onclick="toggleNestedMenu(this)">
          ---
        </button>
      </button>
  
      <div class="nested-btn-menu">
        <a onclick="DeleteCoversation(${data.conversations[conver].id})">Delete chat</a>
      </div>
    </div>`
    );
  }
  // Highlight currently active conversation
  HighlightConversation(currentConversationId);
  // Load conversation messages
  DisplayMessages(data);
}

function DisplayMessages(data) {
  for (const key in data.messages) {
    if (data.messages[key].conversationId === currentConversationId) {
      for (const message in data.messages[key].messages) {
        const jsonObject = JSON.parse(
          data.messages[key].messages[message].message_text
        );
        conversationContainer.insertAdjacentHTML(
          "beforeend",
          `<div class="conver-user-container">
              <div class="conver-user">
              ${CheckMessageFrom(
                jsonObject.role === "user" ? "You" : "ChatGPT"
              )}
              <div class="conver-username">${
                jsonObject.role === "user" ? "You" : "ChatGPT"
              }</div>
              </div>
              <div class="conver-text">
                  ${StructureMessages(jsonObject.content)}
              </div>
          </div>`
        );
      }
    }
  }
  // Scroll down after new message been added
  ScrollDownConversation();
}

function AddConversation(conversationTopic, conversationId) {
  currentConversationId = conversationId;
  conversationMenuContainer.insertAdjacentHTML(
    "afterbegin",
    `<div class="chat-btn-container" id="${conversationId}delete">
    <button class="chat-btn" onclick="SelectConversation(${conversationId})">
      <a id="${conversationId}">${conversationTopic}</a>
      <button class="nested-chat-btn" onclick="toggleNestedMenu(this)">
        ---
      </button>
    </button>

    <div class="nested-btn-menu">
      <a onclick="DeleteCoversation(${conversationId})">Delete chat</a>
    </div>
  </div>`
  );
  // Highlight currently active conversation
  HighlightConversation(currentConversationId);
}

// Update conversation and input html elements
function UpdateConversation(message, username) {
  conversationContainer.insertAdjacentHTML(
    "beforeend",
    `<div class="conver-user-container">
        <div class="conver-user">
        ${CheckMessageFrom(username)}
        <div class="conver-username">${username}</div>
        </div>
        <div class="conver-text">
            ${StructureMessages(message)}
        </div>
    </div>`
  );
  if (username === "You") {
    AddAiResponseLoading();
  }
  // Scroll down after new message been added
  ScrollDownConversation();
}

// Checks if message is from user or chatgpt
function CheckMessageFrom(username) {
  if (username === "You") {
    return `<div class="conversation-user-avatar"><a>${DisplayUserLogo()}</a></div>`;
  } else {
    return `<img src="${"https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/768px-ChatGPT_logo.svg.png"} "class="conversation-profile-img"/>`;
  }
}

// Submit message to server
function submitForm() {
  const textarea = document.getElementById("resizableTextarea");
  const message = textarea.value.trim();
  if (message !== "") {
    sendMessage(message);
    UpdateConversation(message, "You");
    // Clear the textarea
    textarea.value = "";
  }
}

function AddAiResponseLoading() {
  conversationContainer.insertAdjacentHTML(
    "beforeend",
    `<div class="conver-user-container">
        <div class="conver-user">
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/768px-ChatGPT_logo.svg.png" 
        class="conversation-profile-img conversation-profile-img-toggle-rotate"/>
        <div class="conver-username">ChatGPT</div>
        </div>
        <div class="conver-text">
        </div>
    </div>`
  );
}

function RemoveAiReasponseLoding() {
  const allMessages = document.querySelectorAll(".conver-user-container");
  if (allMessages.length > 0) {
    conversationContainer.removeChild(allMessages[allMessages.length - 1]);
  }
}

// Add new conversation
function NewConversation() {
  ClearMessages();
  currentConversationId = -1;
  HighlightConversation(-1);
}

// Select conversation
async function SelectConversation(conversationId) {
  const response = await fetch("/retrieveConversation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId }),
  });

  if (response.ok) {
    const result = await response.json();
    console.log(result);
    currentConversationId = conversationId;
    ClearMessages();
    DisplayMessages(result.userData);
    console.log(conversationId);
    HighlightConversation(currentConversationId);
  } else {
    console.error(
      "Failed to send message:",
      response.status,
      response.statusText
    );
  }
}

// Clear messages
function ClearMessages() {
  const allMessages = document.querySelectorAll(".conver-user-container");
  for (let i = 1; i < allMessages.length; i++) {
    conversationContainer.removeChild(allMessages[i]);
  }
}

// Delete conversations and messages
async function DeleteCoversation(conversationId) {
  const response = await fetch("/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId }),
  });

  if (response.ok) {
    const result = await response.json();
    console.log(result);
    RemoveConversation(result.converId);
  } else {
    console.error(
      "Failed to send message:",
      response.status,
      response.statusText
    );
  }
}

// Removes conversation button HTML from the page after
// conversation infromation was deleted on database side first
function RemoveConversation(converId) {
  console.log(converId);
  const conversationButton = document.getElementById(converId + "delete");
  console.log(conversationButton);
  conversationButton.remove();
  ClearMessages();
}

function StructureMessages(originalMessage) {
  let storedOriginalMessage = originalMessage;
  // Remove all < > elements
  storedOriginalMessage = originalMessage
    .replace(/\</g, "&lt;")
    .replace(/\>/g, "&gt");

  storedOriginalMessage = RestructureCode(storedOriginalMessage);

  storedOriginalMessage = storedOriginalMessage.replace(/\n/g, "<br>");

  return storedOriginalMessage;
}

function RestructureCode(messageWithRemovedElements) {
  let structuredCode = messageWithRemovedElements;

  if (structuredCode.match(/```\w+/g)) {
    const codeFound = structuredCode.replace(/```(\w+)/g, (match, language) => {
      return `<pre><div class="code-background"><div class="code-name-bg">${CorrectCodeLanguageName(
        language
      )}</div><div class="code-container"><code>`;
    });
    //
    structuredCode = codeFound.replace(/```/g, `</code></div></div></pre>`);
  }
  // Find comments and change color
  const commentsColored = structuredCode.replace(
    /<code>[\s\S]*?<\/code>/g,
    (match) => {
      const comments = match.replace(/(\/\/ .*|\# .*|\/\*)/g, (comment) => {
        return `<span style='color:#008000'>${comment}</span>`;
      });
      return comments;
    }
  );
  //
  return commentsColored;
}

function CorrectCodeLanguageName(language) {
  switch (language) {
    case "cpp":
      return "c++";

    case "csharp":
      return "c#";

    default:
      return language;
  }
}

// Logout
async function Logout() {
  try {
    const response = await fetch("/logout", {
      method: "GET",
    });

    if (response.ok) {
      // Redirect to the login page after successful logout
      window.location.href = "/";
    } else {
      console.error("Error during logout");
    }
  } catch (error) {
    console.error("Error during logout:", error);
  }
}
