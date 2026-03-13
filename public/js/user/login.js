// Toggle password visibility
function togglePassword(id) {
  const input = document.getElementById(id);
  input.type = input.type === "password" ? "text" : "password";
}

// Form validation with SweetAlert
document.getElementById("loginForm").addEventListener("submit", function (e) {
  const email = document.getElementById("email");
  const password = document.getElementById("password");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Email validation
  if (!email.value.trim()) {
    e.preventDefault();
    Swal.fire({
      icon: 'warning',
      title: 'Email Required',
      text: 'Please enter your email address.'
    });
    return;
  }

  if (!emailRegex.test(email.value)) {
    e.preventDefault();
    Swal.fire({
      icon: 'error',
      title: 'Invalid Email',
      text: 'Please enter a valid email address.'
    });
    return;
  }

  // Password validation
  if (!password.value.trim()) {
    e.preventDefault();
    Swal.fire({
      icon: 'warning',
      title: 'Password Required',
      text: 'Please enter your password.'
    });
    return;
  }

  if (password.value.length < 6) {
    e.preventDefault();
    Swal.fire({
      icon: 'error',
      title: 'Weak Password',
      text: 'Password must be at least 6 characters long.'
    });
    return;
  }

 
});