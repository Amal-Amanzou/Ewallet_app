  import
import { finduserbymail } from "../Model/database.js";

// DOM
const mailInput = document.getElementById("mail");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submitbtn");
const display = document.getElementById("display");

// event
submitBtn.addEventListener("click", handleSubmit);

// function Promise
function checkUserLogin(mail, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = finduserbymail(mail, password);

      if (user) {
        resolve(user);
      } else {
        reject("Bad credentials");
      }
    }, 2000);
  });
}

// handler
function handleSubmit() {
  let mail = mailInput.value;
  let password = passwordInput.value;

  if (!mail || password === "") {
    alert("Bad credentials.");
    return;
  }

  submitBtn.textContent = "Checking...";

  checkUserLogin(mail, password)
    .then((user) => {
      sessionStorage.setItem("currentUser", JSON.stringify(user));
      document.location = "dashboard.html";
    })
    .catch((err) => {
      alert(err);
      submitBtn.textContent = "Se connecter";
    });
}