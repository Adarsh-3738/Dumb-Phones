const form = document.getElementById("loginForm");
const email = document.getElementById("email");
const password = document.getElementById("password");

const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");

const toggleEye = document.getElementById("toggleEye");

/* Password toggle */
toggleEye.addEventListener("click", () => {
  const isPassword = password.type === "password";
  password.type = isPassword ? "text" : "password";
  toggleEye.classList.toggle("fa-eye");
  toggleEye.classList.toggle("fa-eye-slash");
});

/* Validation */
form.addEventListener("submit", (e) => {
  let isValid = true;

  emailError.textContent = "";
  passwordError.textContent = "";

  // Email validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value.trim()) {
    emailError.textContent = "Email is required";
    isValid = false;
  } else if (!emailPattern.test(email.value)) {
    emailError.textContent = "Enter a valid email address";
    isValid = false;
  }

  // Password validation
  if (!password.value.trim()) {
    passwordError.textContent = "Password is required";
    isValid = false;
  } else if (password.value.length < 6) {
    passwordError.textContent = "Password must be at least 6 characters";
    isValid = false;
  }

  if (!isValid) {
    e.preventDefault(); // Stop form submission
  }
});
