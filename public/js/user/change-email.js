document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("changeEmailForm");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let hasErrors = false;

      // Clear previous
      const errorMsg = document.getElementById("error-email");
      const emailInput = document.getElementById("email");
      
      if (errorMsg) errorMsg.textContent = "";
      if (emailInput) emailInput.classList.remove("error-border");

      const emailVal = emailInput.value.trim();

      // Simple email regex test
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailVal) {
        errorMsg.textContent = "Email address is required";
        emailInput.classList.add("error-border");
        hasErrors = true;
      } else if (!emailRegex.test(emailVal)) {
        errorMsg.textContent = "Please enter a valid email format";
        emailInput.classList.add("error-border");
        hasErrors = true;
      }

      if (!hasErrors) {
        form.submit();
      }
    });
  }
});
