
const input = document.getElementById("imageInput");
const preview = document.getElementById("preview");
const form = document.getElementById("editProfileForm");
const clearBtn = document.getElementById("clearImageBtn");
let cropper;

// Realtime phone restriction/ only allow numbers
const phoneInput = document.getElementById("phoneInput");
if (phoneInput) {
  phoneInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
  });
}

// Clear Image functionality
if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    // Reset file input
    input.value = "";
    
    // Set flag to remove image in backend
    document.getElementById("removeImageFlag").value = "true";
    
    // Reset preview to the default dummy avatar (if no initial image)
    const initialName = document.getElementById('nameInput');
    const nameStr = initialName ? initialName.value : 'User';
    preview.src = `https://ui-avatars.com/api/?name=${nameStr}&background=1d4ed8&color=fff&size=200&rounded=true`;
    
    // Hide the cropped preview element
    const croppedWrap = document.querySelector('.cropped-preview-wrap');
    if (croppedWrap) croppedWrap.style.display = 'none';
    
    // Widen the main preview back
    const mainWrap = document.querySelector('.preview-wrap');
    if (mainWrap) {
      mainWrap.style.borderRadius = '50%';
      mainWrap.style.width = '120px';
      mainWrap.style.height = '120px';
    }
    
    // Destroy cropper if active
    if (cropper) {
      cropper.destroy();
      cropper = null;
    }
  });
}

input.addEventListener("change", (e) => {
  document.getElementById("removeImageFlag").value = "false";
  
  const file = e.target.files[0];
  if (!file) return;

  // Image Format Validation
  if (!file.type.startsWith('image/')) {
    Swal.fire({
      icon: 'error',
      title: 'Invalid File Format',
      text: 'Only image files (JPEG, PNG, WEBP, etc.) are allowed.',
      confirmButtonColor: '#1d4ed8'
    });
    e.target.value = "";
    return;
  }

  // 2MB Size Limit validation
  if (file.size > 2 * 1024 * 1024) {
    Swal.fire({
      icon: 'error',
      title: 'File Too Large',
      text: 'Profile image must be strictly under 2MB. Please select a smaller file.',
      confirmButtonColor: '#1d4ed8'
    });
    // Clear the invalid file selection
    e.target.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    preview.src = reader.result;

    if (cropper) cropper.destroy();

    // Show the cropped preview element
    const croppedWrap = document.querySelector('.cropped-preview-wrap');
    if (croppedWrap) croppedWrap.style.display = 'flex';
    
    // Temporarily make the main crop area square and larger for better editing
    const mainWrap = document.querySelector('.preview-wrap');
    if (mainWrap) {
      mainWrap.style.borderRadius = '8px';
      mainWrap.style.width = '200px';
      mainWrap.style.height = '200px';
    }

    cropper = new Cropper(preview, {
      aspectRatio: 1,
      viewMode: 1,
      background: false,
      preview: '.img-preview',
      autoCropArea: 1
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
  } else if (!/^[A-Za-z0-9 ]+$/.test(name)) {
    showError("nameInput", "Name can only contain letters, numbers and spaces");
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

  // Prevent double submissions
  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerHTML = 'Saving...';

  if (!cropper) {
    form.submit();
    return;
  }

  // Handle cropping and submitting
  cropper.getCroppedCanvas({ width: 300, height: 300 }).toBlob((blob) => {
    // Overwrite the original uncropped file with the cropped blob 
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File([blob], "profile.jpg", { type: "image/jpeg" }));
    
    const fileInput = document.getElementById("imageInput");
    fileInput.files = dataTransfer.files;
    
    form.submit();
  });
});
