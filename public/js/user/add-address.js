
const form = document.querySelector(".address-form");

// Realtime input restriction/ only allow numbers
const phoneInput = document.getElementById("phone");
const altPhoneInput = document.getElementById("altPhone");
const pincodeInput = document.getElementById("pincode");

const restrictToNumbers = (e) => {
  e.target.value = e.target.value.replace(/[^0-9]/g, '');
};

if (phoneInput) phoneInput.addEventListener("input", restrictToNumbers);
if (altPhoneInput) altPhoneInput.addEventListener("input", restrictToNumbers);
if (pincodeInput) pincodeInput.addEventListener("input", restrictToNumbers);

form.addEventListener("submit", function(e) {
  e.preventDefault(); 
  let hasErrors = false;

  // Helper to clear errors
  const clearErrors = () => {
    document.querySelectorAll(".error-message").forEach(el => el.textContent = "");
    document.querySelectorAll("input").forEach(el => el.classList.remove("error-border"));
  };

  // Helper to show errors
  const showError = (fieldId, message) => {
    const errorEl = document.getElementById(`error-${fieldId}`);
    const inputEl = document.getElementById(fieldId);
    if (errorEl && inputEl) {
      errorEl.textContent = message;
      inputEl.classList.add("error-border");
      hasErrors = true;
    }
  };

  clearErrors();

  // Address Type /Auto Title Case & Validation
  let addressTypeInput = document.getElementById("addressType");
  let addressType = addressTypeInput.value.trim();
  // Format to title case ("home" to "Home")
  if (addressType) {
    addressType = addressType.charAt(0).toUpperCase() + addressType.slice(1).toLowerCase();
    addressTypeInput.value = addressType; // Update the actual input value
  }
  
  if (!addressType) {
    showError("addressType", "Address type is required");
  } else if (!["Home", "Office"].includes(addressType)) {
    showError("addressType", "Must be strictly 'Home' or 'Office'");
  }

  // Name Validation
  const name = document.getElementById("name").value.trim();
  if (!name) {
    showError("name", "Full name is required");
  } else if (name.length < 3) {
    showError("name", "Name must be at least 3 characters");
  } else if (!/^[A-Za-z ]+$/.test(name)) {
    showError("name", "Name can only contain letters and spaces");
  }

  // Phone Validation
  const phone = document.getElementById("phone").value.trim();
  if (!phone) {
    showError("phone", "Phone number is required");
  } else if (!/^\d{10}$/.test(phone)) {
    showError("phone", "Phone number must be exactly 10 digits");
  }

  // Alternate Phone
  const altPhone = document.getElementById("altPhone").value.trim();
  if (altPhone && !/^\d{10}$/.test(altPhone)) {
    showError("altPhone", "Alternate phone must be exactly 10 digits");
  }

  // Landmark
  const landmark = document.getElementById("landmark").value.trim();
  if (!landmark) {
    showError("landmark", "Landmark is required");
  } else if (landmark.length < 3) {
    showError("landmark", "Landmark must be at least 3 characters");
  }

  // City
  const city = document.getElementById("city").value.trim();
  if (!city) {
    showError("city", "City is required");
  } else if (city.length < 2) {
    showError("city", "City must be at least 2 characters");
  } else if (!/^[A-Za-z ]+$/.test(city)) {
    showError("city", "City can only contain letters and spaces");
  }

  // State
  const state = document.getElementById("state").value.trim();
  if (!state) {
    showError("state", "State is required");
  } else if (state.length < 2) {
    showError("state", "State must be at least 2 characters");
  } else if (!/^[A-Za-z ]+$/.test(state)) {
    showError("state", "State can only contain letters and spaces");
  }

  // Pincode
  const pincode = document.getElementById("pincode").value.trim();
  if (!pincode) {
    showError("pincode", "Pincode is required");
  } else if (!/^\d{6}$/.test(pincode)) {
    showError("pincode", "Pincode must be exactly 6 digits");
  }

  if (!hasErrors) {
    form.submit();
  }
});
