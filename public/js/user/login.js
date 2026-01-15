
function togglePassword(id) {
  const input = document.getElementById(id);
  input.type = input.type === "password" ? "text" : "password";
}

// for validation
document.querySelector("form").addEventListener("submit", function (e) {
  let valid = true;

  const email = document.getElementById("email");
  const password = document.getElementById("password");

  // Clear previous errors
  document.querySelectorAll(".client-error").forEach(el => el.remove());

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value.trim()) {
    showError(email, "Email is required");
    valid = false;
  } else if (!emailRegex.test(email.value)) {
    showError(email, "Enter a valid email");
    valid = false;
  }

  // Password validation
  if (!password.value.trim()) {
    showError(password, "Password is required");
    valid = false;
  } else if (password.value.length < 6) {
    showError(password, "Password must be at least 6 characters");
    valid = false;
  }

  if (!valid) e.preventDefault();
});
//error showing on email and password
function showError(input, message) {
  const error = document.createElement("div");
  error.className = "error-text client-error";
  error.innerText = message;
  input.closest(".input-box").appendChild(error);
}



