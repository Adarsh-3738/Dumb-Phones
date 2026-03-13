const resendBtn = document.getElementById('resendBtn');
const timerSpan = document.getElementById('timer');
const form = document.getElementById('verifyForm');

let countdown = 60;

// Handle Form Submission Validation
if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let hasErrors = false;

    const errorMsg = document.getElementById("error-otp");
    const otpInput = document.getElementById("otp");

    if (errorMsg) errorMsg.textContent = "";
    if (otpInput) otpInput.classList.remove("error-border");

    const otpVal = otpInput.value.trim();

    if (!otpVal) {
      errorMsg.textContent = "Please enter the OTP";
      otpInput.classList.add("error-border");
      hasErrors = true;
    } else if (!/^\d{6}$/.test(otpVal)) {
      errorMsg.textContent = "OTP must be exactly 6 digits";
      otpInput.classList.add("error-border");
      hasErrors = true;
    }

    if (!hasErrors) {
      form.submit();
    }
  });
}

// Start the timer
const timerInterval = setInterval(() => {
  countdown--;
  timerSpan.textContent = countdown;

  if (countdown <= 0) {
    clearInterval(timerInterval);
    timerSpan.textContent = '';
    resendBtn.style.display = 'inline-block'; // show button
  }
}, 1000);

// Handle Resend OTP click
resendBtn.addEventListener('click', async () => {
  resendBtn.style.display = 'none'; // hide button again
  countdown = 60;
  timerSpan.textContent = countdown;

  // Restart timer
  const newInterval = setInterval(() => {
    countdown--;
    timerSpan.textContent = countdown;

    if (countdown <= 0) {
      clearInterval(newInterval);
      timerSpan.textContent = '';
      resendBtn.style.display = 'inline-block'; // show button again
    }
  }, 1000);

  try {
    const res = await fetch('/resend/otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();

    if (data.success) {
      Swal.fire({
        icon: 'success',
        title: 'OTP Sent',
        text: 'A new OTP has been sent to your email.',
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: data.message || 'Could not send OTP. Try again later.',
      });
    }
  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'Something went wrong. Try again.',
    });
  }
});
