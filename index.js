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
    updateConversation(result.openaiResponse, "ChatGPT");
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
    InsertUsername(result);
    OnLoadAddConversation(result);
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
  usernameId.textContent = username.userData.user.username;
}

function AddConversation(conversationTopic, conversationId) {
  currentConversationId = conversationId;
  conversationMenuContainer.insertAdjacentHTML(
    "beforebegin",
    `<div class="chat-btn-container" id="${conversationId}delete">
    <button class="chat-btn">
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
}

// Update conversation and input html elements
function updateConversation(message, username) {
  conversationContainer.insertAdjacentHTML(
    "beforeend",
    `<div class="conver-user-container">
        <div class="conver-user">
        <img
            src="${
              username === "You"
                ? "https://pics.craiyon.com/2023-06-25/840d68a3348b4f00b23af0cfc4ac71d2.webp"
                : "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/768px-ChatGPT_logo.svg.png"
            }"
            class="conversation-profile-img"
        />
        <div class="conver-username">${username}</div>
        </div>
        <div class="conver-text">
            ${message}
        </div>
    </div>`
  );
  if (username === "You") {
    AddAiResponseLoading();
  }
  // Scroll down after new message been added
  ScrollDownConversation();
}

// Submit message to server
function submitForm() {
  const textarea = document.getElementById("resizableTextarea");
  const message = textarea.value.trim();
  if (message !== "") {
    sendMessage(message);
    updateConversation(message, "You");
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

function OnLoadAddConversation(data) {
  console.log(data.userData.conversations.length === 0);
  if (data.userData.conversations.length === 0) {
    return;
  }
  currentConversationId = data.userData.conversations[0].id;
  console.log(data.userData.conversations[0].id);
  for (const conver in data.userData.conversations) {
    console.log(data.userData.conversations[conver].id);
    console.log(data.userData.conversations[conver].conversation);

    conversationMenuContainer.insertAdjacentHTML(
      "afterbegin",
      `<div class="chat-btn-container" id="${data.userData.conversations[conver].id}delete">
      <button class="chat-btn" onclick="SelectConversation(${data.userData.conversations[conver].id})">
        <a id="${data.userData.conversations[conver].id}">${data.userData.conversations[conver].conversation}</a>
        <button class="nested-chat-btn" onclick="toggleNestedMenu(this)">
          ---
        </button>
      </button>
  
      <div class="nested-btn-menu">
        <a onclick="DeleteCoversation(${data.userData.conversations[conver].id})">Delete chat</a>
      </div>
    </div>`
    );
  }
  // Load conversation messages
  DisplayMessages(data);
}

function DisplayMessages(data) {
  for (const key in data.userData.messages) {
    console.log("Messages: ", data.userData.messages[key]);
    if (data.userData.messages[key].conversationId === currentConversationId) {
      for (const message in data.userData.messages[key].messages) {
        const jsonObject = JSON.parse(
          data.userData.messages[key].messages[message].message_text
        );
        console.log("Message: ", jsonObject.content);
        conversationContainer.insertAdjacentHTML(
          "beforeend",
          `<div class="conver-user-container">
              <div class="conver-user">
              <img
                  src="${
                    jsonObject.role === "user"
                      ? "https://pics.craiyon.com/2023-06-25/840d68a3348b4f00b23af0cfc4ac71d2.webp"
                      : "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/768px-ChatGPT_logo.svg.png"
                  }"
                  class="conversation-profile-img"
              />
              <div class="conver-username">${
                jsonObject.role === "user" ? "You" : "ChatGPT"
              }</div>
              </div>
              <div class="conver-text">
                  ${jsonObject.content}
              </div>
          </div>`
        );
      }
    }
  }
  // Scroll down after new message been added
  ScrollDownConversation();
}

// Add new conversation
function NewConversation() {
  ClearMessages();
  currentConversationId = -1;
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
    ClearMessages();
    DisplayMessages(result);
    console.log(conversationId);
    currentConversationId = conversationId;
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

function RemoveConversation(converId) {
  console.log(converId);
  const conversationButton = document.getElementById(converId + "delete");
  console.log(conversationButton);
  conversationButton.remove();
  ClearMessages();
}
