document.addEventListener("DOMContentLoaded", () => {
  // Frontend Validation
  const forgotPasswordForm = document.getElementById("forgotPasswordForm");
  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", function(e) {
      const email = document.getElementById("email").value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!email) {
        e.preventDefault();
        Swal.fire({
          icon: 'error',
          title: 'Required Field',
          text: 'Please enter your email address.',
          confirmButtonColor: '#2563eb'
        });
        return;
      }
      
      if (!emailRegex.test(email)) {
        e.preventDefault();
        Swal.fire({
          icon: 'error',
          title: 'Invalid Email',
          text: 'Please enter a valid email address (e.g. name@example.com).',
          confirmButtonColor: '#2563eb'
        });
        return;
      }
    });
  }

  // Backend Response Alerts
  const messageEl = document.querySelector('.message');
  if (messageEl && messageEl.innerText.trim() !== '') {
    const msg = messageEl.innerText.trim();
    if (msg.toLowerCase().includes('sent') || msg.toLowerCase().includes('success')) {
       Swal.fire({
          icon: 'success',
          title: 'Link Sent!',
          text: msg,
          confirmButtonColor: '#2563eb'
        });
    } else {
       Swal.fire({
          icon: 'error',
          title: 'Error',
          text: msg,
          confirmButtonColor: '#2563eb'
        });
    }
    messageEl.style.display = 'none';
  }
});
