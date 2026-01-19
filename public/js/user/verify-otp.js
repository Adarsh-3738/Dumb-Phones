// OTP input auto-focus
const inputs = document.querySelectorAll(".otp");

inputs.forEach((input, index) => {
  input.addEventListener("input", () => {
    if (input.value && index < inputs.length - 1) {
      inputs[index + 1].focus();
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && index > 0 && !input.value) {
      inputs[index - 1].focus();
    }
  });
});

// Timer logic
let timeLeft = 60;
let timerEl = document.getElementById("timer");
let resendBtn = document.getElementById("resendBtn");

let timerInterval = setInterval(updateTimer, 1000);

function updateTimer() {
  timeLeft--;
  timerEl.textContent = timeLeft;

  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    resendBtn.classList.remove("disabled");
    resendBtn.textContent = "Resend";
  }
}

// Resend OTP
resendBtn.addEventListener("click", () => {
  if (resendBtn.classList.contains("disabled")) return;

  $.get("/resend-otp", (response) => {
    if (response.success) {
      Swal.fire("OTP Sent!", "Check your email.", "success");
    } else {
      Swal.fire("Error", response.message, "error");
    }
  });

  timeLeft = 60;
  resendBtn.classList.add("disabled");
  resendBtn.innerHTML = `Resend (<span id="timer">60</span>s)`;
  timerEl = document.getElementById("timer");

  clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);
});

// Verify OTP
document.getElementById("otpForm").addEventListener("submit", (e) => {
  e.preventDefault();

  let otp = "";
  inputs.forEach(input => otp += input.value);

  if (otp.length !== 6) {
    return Swal.fire("Invalid OTP", "Enter all 6 digits", "error");
  }

  $.post("/verify-otp", { otp }, (response) => {
    if (response.success) {
      Swal.fire({
        icon: "success",
        title: "OTP Verified",
        showConfirmButton: false,
        timer: 1500
      }).then(() => {
        window.location.href = response.redirectUrl;
      });
    } else {
      Swal.fire("Error", response.message, "error");
    }
  });
});
