document.addEventListener("DOMContentLoaded", () => {
  // Handle server message if present
  const serverMessageEl = document.getElementById("serverMessage");
  if (serverMessageEl && serverMessageEl.dataset.message) {
    const msg = serverMessageEl.dataset.message;
    if (msg.trim() !== "") {
      Swal.fire({
        icon: 'error',
        title: 'Wait a moment',
        text: msg,
        confirmButtonColor: '#1d4ed8'
      });
    }
  }

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

      const emailVal = emailInput ? emailInput.value.trim() : "";

      // Simple email regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailVal) {
        if (errorMsg) errorMsg.textContent = "Email address is required";
        if (emailInput) emailInput.classList.add("error-border");
        hasErrors = true;
      } else if (!emailRegex.test(emailVal)) {
        if (errorMsg) errorMsg.textContent = "Please enter a valid email format";
        if (emailInput) emailInput.classList.add("error-border");
        hasErrors = true;
      }

      if (!hasErrors) {
        form.submit();
      }
    });
  }
});
