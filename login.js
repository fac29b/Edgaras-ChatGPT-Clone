const loginFailed = document.getElementById("loginFailed");

function DisplayRegisterMsg(result) {
  if (result.success) {
    loginFailed.style.display = "none";
    // Redirect to the home page upon successful login
    window.location.href = result.redirectUrl;
  } else if (result.error) {
    loginFailed.textContent = result.error;
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
      DisplayRegisterMsg(result);
    } else {
      const result = await response.json();
      DisplayRegisterMsg(result);
    }
  } catch (error) {
    console.error("Error during log in:", error);
  }
}
