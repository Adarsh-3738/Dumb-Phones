const inputs = document.querySelectorAll(".otp");
const form = document.getElementById("otpForm");
const resendBtn = document.getElementById("resendBtn");
let timerText = document.getElementById("timer");

let timeLeft = 60;
let countdown;

// AUTO FOCUS
inputs.forEach((input, index) => {
  input.addEventListener("input", () => {
    input.value = input.value.replace(/[^0-9]/g, "");
    if (input.value && index < inputs.length - 1) {
      inputs[index + 1].focus();
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && !input.value && index > 0) {
      inputs[index - 1].focus();
    }
  });
});

// VERIFY OTP
form.addEventListener("submit", function (e) {
  e.preventDefault();

  let otp = "";
  inputs.forEach(input => otp += input.value);

  if (otp.length !== 6) {
    Swal.fire("Invalid OTP", "Enter all 6 digits", "error");
    return;
  }

  $.ajax({
    url: "/verify-otp",
    method: "POST",
    data: { otp },

    success: function (response) {
      Swal.fire({
        icon: "success",
        title: "OTP Verified",
        showConfirmButton: false,
        timer: 1500
      }).then(() => {
        window.location.href = response.redirectUrl;
      });
    },

    error: function (xhr) {
      Swal.fire({
        icon: "error",
        title: "Invalid OTP",
        text: xhr.responseJSON?.message || "OTP verification failed"
      });

      inputs.forEach(i => i.value = "");
      inputs[0].focus();
    }
  });
});

// TIMER FUNCTION
function startTimer() {

  clearInterval(countdown);

  countdown = setInterval(() => {

    timeLeft--;
    timerText.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(countdown);

      resendBtn.classList.remove("disabled");
      resendBtn.textContent = "Resend OTP";
    }

  }, 1000);
}

// START TIMER ON PAGE LOAD
startTimer();

// RESEND OTP
resendBtn.addEventListener("click", function () {

  if (resendBtn.classList.contains("disabled")) return;

  $.ajax({
    url: "/resend-otp",
    method: "POST",

    success: function () {

      Swal.fire({
        icon: "success",
        title: "OTP Sent Again",
        timer: 1500,
        showConfirmButton: false
      });

      timeLeft = 60;
      timerText.textContent = timeLeft;

      resendBtn.classList.add("disabled");
resendBtn.innerHTML = `Resend (<span id="timer">${timeLeft}</span>s)`;
timerText = document.getElementById("timer");
      startTimer();

    },

    error: function () {
      Swal.fire("Error", "Failed to resend OTP", "error");
    }
  });

});