function togglePassword(id) {
  const input = document.getElementById(id);
  input.type = input.type === "password" ? "text" : "password";
}

const nameField = document.getElementById("name");
const phoneField = document.getElementById("phone");
const emailField = document.getElementById("email");
const passwordField = document.getElementById("password");
const cPasswordField = document.getElementById("cPassword");

const error1 = document.getElementById("error1");
const error2 = document.getElementById("error2");
const error3 = document.getElementById("error3");
const error4 = document.getElementById("error4");
const error5 = document.getElementById("error5");

function clearErrors() {
  error1.textContent = "";
  error2.textContent = "";
  error3.textContent = "";
  error4.textContent = "";
  error5.textContent = "";
}

function validateName() {
  return /^[A-Za-z\s]{3,}$/.test(nameField.value.trim()) || (error1.textContent = "Invalid name", false);
}

function validatePhone() {
  return /^\d{10}$/.test(phoneField.value.trim()) || (error2.textContent = "Invalid phone", false);
}

function validateEmail() {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailField.value.trim()) || (error3.textContent = "Invalid email", false);
}

function validatePassword() {
  const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  let valid = true;

  if (!pattern.test(passwordField.value)) {
    error4.textContent = "Weak password";
    valid = false;
  }
  if (passwordField.value !== cPasswordField.value) {
    error5.textContent = "Passwords do not match";
    valid = false;
  }
  return valid;
}

document.getElementById("signform").addEventListener("submit", function (e) {
  clearErrors();
  if (!(validateName() && validatePhone() && validateEmail() && validatePassword())) {
    e.preventDefault();
  }
});
