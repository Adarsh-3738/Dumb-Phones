document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".toggle-password").forEach(icon => {
    icon.addEventListener("click", () => {
      const input = icon.previousElementSibling;
      input.type = input.type === "password" ? "text" : "password";
      icon.textContent = input.type === "password" ? "👁" : "🙈";
    });
  });

  const form = document.getElementById("changePasswordForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let hasErrors = false;

      // Clear previous
      document.querySelectorAll(".error-message").forEach(el => el.textContent = "");
      document.querySelectorAll("input").forEach(el => el.classList.remove("error-border"));

      const showError = (fieldId, message) => {
        const errorEl = document.getElementById(`error-${fieldId}`);
        const inputEl = document.getElementById(fieldId);
        if (errorEl && inputEl) {
          errorEl.textContent = message;
          inputEl.classList.add("error-border");
          hasErrors = true;
        }
      };

      const currentPassword = document.getElementById("currentPassword").value.trim();
      const newPassword = document.getElementById("newPassword").value.trim();
      const confirmPassword = document.getElementById("confirmPassword").value.trim();

      if (!currentPassword) {
        showError("currentPassword", "Current password is required");
      }

      if (!newPassword) {
        showError("newPassword", "New password is required");
      } else if (newPassword.length < 6) {
        showError("newPassword", "New password must be at least 6 characters");
      }

      if (!confirmPassword) {
        showError("confirmPassword", "Please confirm your new password");
      } else if (newPassword !== confirmPassword) {
        showError("confirmPassword", "Passwords do not match");
      }

      if (!hasErrors) {
        // Use Fetch instead of default form submit
        fetch("/change-password", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword
          })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            Swal.fire({
              icon: "success",
              title: "Password Updated",
              text: data.message,
              confirmButtonColor: "#28a745",
              confirmButtonText: "Login Now"
            }).then(() => {
               window.location.href = "/login";
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Update Failed",
              text: data.message || "Could not update password",
              confirmButtonColor: "#d33"
            });
          }
        })
        .catch(err => {
          console.error("Change Password Error:", err);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Something went wrong. Please try again later.",
            confirmButtonColor: "#d33"
          });
        });
      }
    });
  }
});
