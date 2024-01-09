const registrationSuccess = document.getElementById("registrationSuccess");
const registrationFailed = document.getElementById("registrationFailed");

function DisplayRegisterMsg(result) {
  if (result.success) {
    registrationSuccess.style.display = "block";
    registrationFailed.textContent = result.message;
    registrationFailed.style.display = "none";
  } else {
    // Errcode: 1062 duplicate entry on the database side
    if (result.error === 1062) {
      registrationFailed.textContent = "Username is already taken.";
    } else {
      registrationFailed.textContent = "Failed to register user.";
    }
    registrationFailed.style.display = "block";
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
    const response = await fetch("/register", {
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
    console.error("Error during registration:", error);
  }
}
