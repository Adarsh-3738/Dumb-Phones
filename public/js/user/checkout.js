let currentEditAddressId = null;

function openAddressModal(btnRef = null) {
  const modal = document.getElementById("addressModal");
  const form = document.getElementById("modalAddressForm");
  const title = document.getElementById("modalTitle");

  form.reset();
  currentEditAddressId = null;

  if (btnRef) {
    try {
      const addrData = btnRef.getAttribute("data-address");
      const addr = JSON.parse(decodeURIComponent(addrData));
      
      title.textContent = "Edit Address";
      currentEditAddressId = addr._id;
      
      document.getElementById("modalAddressType").value = addr.addressType || "Home";
      document.getElementById("modalName").value = addr.name || "";
      document.getElementById("modalPhone").value = addr.phone || "";
      document.getElementById("modalAltPhone").value = addr.altPhone || "";
      document.getElementById("modalPincode").value = addr.pincode || "";
      document.getElementById("modalCity").value = addr.city || "";
      document.getElementById("modalState").value = addr.state || "";
      document.getElementById("modalLandmark").value = addr.landmark || "";
      
    } catch (e) {
      console.error("Failed to parse address data", e);
      title.textContent = "Add New Address";
    }
  } else {
    title.textContent = "Add New Address";
  }

  modal.classList.add("active");
  document.body.style.overflow = "hidden"; // Prevent background scrolling
}

function closeAddressModal() {
  const modal = document.getElementById("addressModal");
  modal.classList.remove("active");
  document.body.style.overflow = "";
}

document.addEventListener("DOMContentLoaded", () => {
  const modalForm = document.getElementById("modalAddressForm");
  const modalSubmitBtn = document.getElementById("modalSubmitBtn");

  // Realtime input restriction to numbers
  const restrictToNumbers = (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
  };
  const mPhone = document.getElementById("modalPhone");
  const mAltPhone = document.getElementById("modalAltPhone");
  const mPincode = document.getElementById("modalPincode");
  if (mPhone) mPhone.addEventListener("input", restrictToNumbers);
  if (mAltPhone) mAltPhone.addEventListener("input", restrictToNumbers);
  if (mPincode) mPincode.addEventListener("input", restrictToNumbers);

  if (modalForm) {
    modalForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      
      let hasErrors = false;

      // Helper to clear errors
      const clearErrors = () => {
        document.querySelectorAll(".error-message").forEach(el => el.textContent = "");
        document.querySelectorAll("#modalAddressForm input").forEach(el => el.classList.remove("error-border"));
      };

      // Helper to show errors
      const showError = (fieldId, message) => {
        const errorEl = document.getElementById(`error-${fieldId}`);
        const inputEl = document.getElementById(`modal${fieldId.charAt(0).toUpperCase() + fieldId.slice(1)}`);
        
        if (errorEl && inputEl) {
          errorEl.textContent = message;
          inputEl.classList.add("error-border");
          hasErrors = true;
        }
      };

      clearErrors();

      // Address Type Validation
      let addressTypeInput = document.getElementById("modalAddressType");
      let addressType = addressTypeInput.value.trim();
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
      const name = document.getElementById("modalName").value.trim();
      if (!name) {
        showError("name", "Full name is required");
      } else if (name.length < 3) {
        showError("name", "Name must be at least 3 characters");
      } else if (!/^[A-Za-z ]+$/.test(name)) {
        showError("name", "Name can only contain letters and spaces");
      }

      // Phone Validation
      const phone = document.getElementById("modalPhone").value.trim();
      if (!phone) {
        showError("phone", "Phone number is required");
      } else if (!/^\d{10}$/.test(phone)) {
        showError("phone", "Phone number must be exactly 10 digits");
      }

      // Alternate Phone
      const altPhone = document.getElementById("modalAltPhone").value.trim();
      if (altPhone && !/^\d{10}$/.test(altPhone)) {
        showError("altPhone", "Alternate phone must be exactly 10 digits");
      }

      // Landmark
      const landmark = document.getElementById("modalLandmark").value.trim();
      if (!landmark) {
        showError("landmark", "Landmark is required");
      } else if (landmark.length < 3) {
        showError("landmark", "Landmark must be at least 3 characters");
      }

      // City
      const city = document.getElementById("modalCity").value.trim();
      if (!city) {
        showError("city", "City is required");
      } else if (city.length < 2) {
        showError("city", "City must be at least 2 characters");
      } else if (!/^[A-Za-z ]+$/.test(city)) {
        showError("city", "City can only contain letters and spaces");
      }

      // State
      const state = document.getElementById("modalState").value.trim();
      if (!state) {
        showError("state", "State is required");
      } else if (state.length < 2) {
        showError("state", "State must be at least 2 characters");
      } else if (!/^[A-Za-z ]+$/.test(state)) {
        showError("state", "State can only contain letters and spaces");
      }

      // Pincode
      const pincode = document.getElementById("modalPincode").value.trim();
      if (!pincode) {
        showError("pincode", "Pincode is required");
      } else if (!/^\d{6}$/.test(pincode)) {
        showError("pincode", "Pincode must be exactly 6 digits");
      }

      if (hasErrors) {
        return; // Stop form submission
      }

      modalSubmitBtn.disabled = true;
      modalSubmitBtn.textContent = "Saving...";

      const formData = new FormData(modalForm);
      const data = Object.fromEntries(formData.entries());
      
      // Checkbox is not in FormData if unchecked
      data.isDefault = false;
      
      try {
        let url = "/address/add?source=checkout";
        let method = "POST";
        
        if (currentEditAddressId) {
          url = `/address/edit/${currentEditAddressId}?source=checkout`;
          method = "PATCH";
        }

        const res = await fetch(url, {
          method: method,
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        });

        const result = await res.json();

        if (result.success) {
          await Swal.fire({
            icon: 'success',
            title: 'Success',
            text: result.message,
            timer: 1500,
            showConfirmButton: false
          });
          location.reload(); // Refresh to show new address
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Validation Error',
            text: result.message || 'Please check your inputs.'
          });
        }
      } catch (err) {
        console.error("Address Error:", err);
        Swal.fire('Error', 'Something went wrong while saving address.', 'error');
      } finally {
        modalSubmitBtn.disabled = false;
        modalSubmitBtn.textContent = "Save Address";
      }
    });
  }

  // Close modal when clicking outside
  const modalOverlay = document.getElementById("addressModal");
  if (modalOverlay) {
    modalOverlay.addEventListener("mousedown", (e) => {
      if (e.target === modalOverlay) {
        closeAddressModal();
      }
    });
  }
});

  document.addEventListener("DOMContentLoaded", () => {
    const addressForm = document.getElementById("addressForm");
    
    if (addressForm) {
      addressForm.addEventListener("submit", (e) => {
        const selectedAddress = document.querySelector('input[name="addressId"]:checked');
        
        if (!selectedAddress) {
          e.preventDefault(); // Stop standard form submission
          
          Swal.fire({
            icon: 'warning',
            title: 'Action Required',
            text: 'Please select a delivery address to place your order. If you haven\'t added one, please add a new address.',
            confirmButtonColor: '#1d4ed8'
          });
        }
      });
    }
  });
