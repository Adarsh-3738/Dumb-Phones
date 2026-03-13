
const input = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const form = document.getElementById("editProfileForm");
let cropper;

input.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    preview.src = reader.result;

    if (cropper) cropper.destroy();

    cropper = new Cropper(preview, {
      aspectRatio: 1,
      viewMode: 1,
      background: false
    });
  };

  reader.readAsDataURL(file);
});

//  form submit
form.addEventListener("submit", (e) => {
  e.preventDefault();
  let hasErrors = false;

  // Clear previous errors
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

  // Name Validation
  const nameInput = document.getElementById("nameInput");
  const name = nameInput.value.trim();
  if (!name) {
    showError("nameInput", "Full name is required");
  } else if (name.length < 3) {
    showError("nameInput", "Name must be at least 3 characters");
  } else if (!/^[A-Za-z ]+$/.test(name)) {
    showError("nameInput", "Name can only contain letters and spaces");
  }

  // Phone Validation
  const phoneInput = document.getElementById("phoneInput");
  const phone = phoneInput.value.trim();
  if (!phone) {
    showError("phoneInput", "Phone number is required");
  } else if (!/^\d{10}$/.test(phone)) {
    showError("phoneInput", "Phone number must be exactly 10 digits");
  }

  if (hasErrors) return;

  // Normal submit if no crop needed
  if (!cropper) {
    form.submit();
    return;
  }

  // Handle cropping and submitting
  cropper.getCroppedCanvas({ width: 300, height: 300 }).toBlob((blob) => {
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File([blob], "profile.jpg"));
    input.files = dataTransfer.files;

    form.submit();
  });
});
