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
