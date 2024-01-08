const loginFailed = document.getElementById("loginFailed");

function DisplayLoginMsg(result) {
  if (result.success) {
    loginFailed.style.display = "none";
    //sendToGlobalData(exportUserData);
    // Redirect to the home page upon successful login
    window.location.href = result.redirectUrl;
  } else if (!result.success) {
    loginFailed.textContent = "Username or Password incorrect.";
    loginFailed.style.display = "block";
  }
}

function SubmitForm(event) {
  event.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  SendForm(username, password);
}

async function SendForm(username, password) {
  try {
    const response = await fetch("/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const result = await response.json();
      DisplayLoginMsg(result);
    } else {
      const result = await response.json();
      DisplayLoginMsg(result);
    }
  } catch (error) {
    console.error("Error during log in:", error);
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
