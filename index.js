const conversationContainer = document.getElementById("conversationContainer");

function toggle() {
  const menuBtnToggle = document.querySelector(".toggle-left-menu-button");
  menuBtnToggle.classList.toggle("left-menu-toggle-button-transition");
  const menuToggle = document.querySelector(".left-menu-container");
  menuToggle.classList.toggle("left-menu-closed");
}

document.addEventListener("click", function (event) {
  var clickedButton = event.target.closest(".nested-chat-btn");
  var isMenu = event.target.closest(".nested-btn-menu");

  if (!clickedButton && !isMenu) {
    closeAllMenusExcept(null);
  }
});

function toggleNestedMenu(button) {
  var menu = button.parentElement.querySelector(".nested-btn-menu");

  if (menu.style.display === "block") {
    menu.style.display = "none";
  } else {
    // Hide all other menus
    closeAllMenusExcept(menu);

    var rect = button.getBoundingClientRect();
    menu.style.top = rect.bottom + "px";
    menu.style.left = rect.left + "px";
    menu.style.display = "block";
  }
}

function closeAllMenusExcept(exceptMenu) {
  var allMenus = document.querySelectorAll(".nested-btn-menu");
  allMenus.forEach(function (menu) {
    if (menu !== exceptMenu && menu.style.display === "block") {
      menu.style.display = "none";
    }
  });
}

// Send message
async function sendMessage(message) {
  const response = await fetch("/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  if (response.ok) {
    const result = await response.json();
    updateConversation(result.openaiResponse, "ChatGPT:");
  } else {
    console.error(
      "Failed to send message:",
      response.status,
      response.statusText
    );
  }
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
}

// Submit message to server
function submitForm() {
  const textarea = document.getElementById("resizableTextarea");
  const message = textarea.value.trim();
  if (message !== "") {
    sendMessage(message);
    updateConversation(message, "You");
    // Optionally, clear the textarea or perform other UI updates
    textarea.value = "";
  }
}
