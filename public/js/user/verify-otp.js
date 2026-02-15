const inputs = document.querySelectorAll(".otp");
const form = document.getElementById("otpForm");

// Auto focus
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
