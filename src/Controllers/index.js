// recuperation des elements DOM
const loginBtn = document.getElementById("Loginbtn");

// event
loginBtn.addEventListener("click", handleLogin);

// function promise
function goToLoginPage() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve("done");
    }, 2000);
  });
}

// handler
function handleLogin() {
  loginBtn.textContent = "loading...";

  goToLoginPage()
    .then(() => {
      document.location = "login.html";
    });
}