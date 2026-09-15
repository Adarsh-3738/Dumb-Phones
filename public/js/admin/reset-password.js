document.addEventListener("DOMContentLoaded", () => {
  // Eye button toggle functionality
  function togglePasswordVisibility(inputId, iconId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(iconId);

    if (input && icon) {
      icon.addEventListener("click", function () {
        if (input.type === "password") {
          input.type = "text";
          icon.classList.remove("fa-eye");
          icon.classList.add("fa-eye-slash");
        } else {
          input.type = "password";
          icon.classList.remove("fa-eye-slash");
          icon.classList.add("fa-eye");
        }
      });
    }
  }

  togglePasswordVisibility("password", "togglePassword");
  togglePasswordVisibility("cPassword", "toggleCPassword");

  // Check for success message from server to trigger SweetAlert
  const messageEl = document.querySelector('.message');
  if (messageEl && messageEl.classList.contains('success')) {
    Swal.fire({
      icon: 'success',
      title: 'Success!',
      text: messageEl.innerText,
      confirmButtonColor: '#2563eb',
      timer: 3000
    }).then(() => {
      window.location.href = "/admin/login";
    });
    messageEl.style.display = 'none';
  } else if (messageEl && !messageEl.classList.contains('success')) {
     Swal.fire({
      icon: 'error',
      title: 'Error',
      text: messageEl.innerText,
      confirmButtonColor: '#2563eb'
    });
    messageEl.style.display = 'none';
  }
});
