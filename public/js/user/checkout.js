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
  document.body.style.overflow = "hidden";
}

function closeAddressModal() {
  const modal = document.getElementById("addressModal");
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
}

async function applyCoupon() {
  const code = document.getElementById("couponCodeInput").value.trim();
  if (!code) return Swal.fire("Code Required", "Please enter a valid coupon code first.", "warning");

  try {
    const res = await fetch("/checkout/apply-coupon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    });
    const data = await res.json();
    if (data.success) {
      await Swal.fire("Coupon Applied!", data.message, "success");
      location.reload();
    } else {
      Swal.fire("Offer Ineligible", data.message, "error");
    }
  } catch (e) { 
    console.error(e);
    Swal.fire("Error", "Could not apply coupon securely.", "error");
  }
}

async function removeCoupon() {
  try {
    const res = await fetch("/checkout/remove-coupon", { method: "POST" });
    const data = await res.json();
    if (data.success) {
      location.reload();
    } else {
      Swal.fire("Failed to Remove", data.message, "error");
    }
  } catch (e) { console.error(e) }
}

async function handleCheckout() {
  const form = document.getElementById("addressForm");
  const addressChecked = document.querySelector('input[name="addressId"]:checked');
  const paymentMethodInput = document.querySelector('input[name="paymentMethod"]:checked');

  if (!addressChecked) {
    return Swal.fire("Address Required", "Please select a delivery address", "warning");
  }

  const paymentMethod = paymentMethodInput ? paymentMethodInput.value : "COD";

  // COD or Wallet: submit form normally
  if (paymentMethod === "COD" || paymentMethod === "Wallet") {
    form.submit();
    return;
  }

  // RAZORPAY PAYMENT
  try {
    const res = await fetch("/checkout/razorpay-create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addressId: addressChecked.value })
    });
    
    const data = await res.json();
    
    if (!data.success) {
      return Swal.fire("Checkout Failed", data.message, "error");
    }

    const options = {
      key: data.key, 
      amount: Math.round(data.amount * 100),
      currency: "INR",
      name: "DumbPhones",
      description: "Order Payment",
      order_id: data.razorpayOrderId,
      
      handler: async function (response) {
        const verifyRes = await fetch("/checkout/razorpay-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            systemOrderId: data.systemOrderId
          })
        });

        const verifyData = await verifyRes.json();
        
        if (verifyData.success) {
           window.location.href = `/order-success?orderId=${data.systemOrderId}`;
        } else {
           Swal.fire("Verification Failed", "Payment was tampered with.", "error");
           window.location.href = `/order-failed?orderId=${data.systemOrderId}`;
        }
      },
      prefill: {
        name: "User",
        email: "user@example.com" 
      },
      theme: { color: "#0f172a" },
      modal: {
        ondismiss: function() {
           window.location.href = `/order-failed?orderId=${data.systemOrderId}`;
        }
      }
    };

    const rzp = new Razorpay(options);
    
    rzp.on('payment.failed', function (response){
      window.location.href = `/order-failed?orderId=${data.systemOrderId}`;
    });

    rzp.open();

  } catch (err) {
    console.error(err);
    Swal.fire("System Error", "Could not initialize payment module.", "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const modalForm = document.getElementById("modalAddressForm");
  const modalSubmitBtn = document.getElementById("modalSubmitBtn");

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

      const clearErrors = () => {
        document.querySelectorAll(".error-message").forEach(el => el.textContent = "");
        document.querySelectorAll("#modalAddressForm input").forEach(el => el.classList.remove("error-border"));
      };

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

      let addressTypeInput = document.getElementById("modalAddressType");
      let addressType = addressTypeInput.value.trim();
      if (addressType) {
        addressType = addressType.charAt(0).toUpperCase() + addressType.slice(1).toLowerCase();
        addressTypeInput.value = addressType;
      }
      if (!addressType) {
        showError("addressType", "Address type is required");
      } else if (!["Home", "Office"].includes(addressType)) {
        showError("addressType", "Must be strictly 'Home' or 'Office'");
      }

      const name = document.getElementById("modalName").value.trim();
      if (!name) {
        showError("name", "Full name is required");
      } else if (name.length < 3) {
        showError("name", "Name must be at least 3 characters");
      } else if (!/^[A-Za-z ]+$/.test(name)) {
        showError("name", "Name can only contain letters and spaces");
      }

      const phone = document.getElementById("modalPhone").value.trim();
      if (!phone) {
        showError("phone", "Phone number is required");
      } else if (!/^\d{10}$/.test(phone)) {
        showError("phone", "Phone number must be exactly 10 digits");
      }

      const altPhone = document.getElementById("modalAltPhone").value.trim();
      if (altPhone && !/^\d{10}$/.test(altPhone)) {
        showError("altPhone", "Alternate phone must be exactly 10 digits");
      }

      const landmark = document.getElementById("modalLandmark").value.trim();
      if (!landmark) {
        showError("landmark", "Landmark is required");
      } else if (landmark.length < 3) {
        showError("landmark", "Landmark must be at least 3 characters");
      }

      const city = document.getElementById("modalCity").value.trim();
      if (!city) {
        showError("city", "City is required");
      } else if (city.length < 2) {
        showError("city", "City must be at least 2 characters");
      } else if (!/^[A-Za-z ]+$/.test(city)) {
        showError("city", "City can only contain letters and spaces");
      }

      const state = document.getElementById("modalState").value.trim();
      if (!state) {
        showError("state", "State is required");
      } else if (state.length < 2) {
        showError("state", "State must be at least 2 characters");
      } else if (!/^[A-Za-z ]+$/.test(state)) {
        showError("state", "State can only contain letters and spaces");
      }

      const pincode = document.getElementById("modalPincode").value.trim();
      if (!pincode) {
        showError("pincode", "Pincode is required");
      } else if (!/^\d{6}$/.test(pincode)) {
        showError("pincode", "Pincode must be exactly 6 digits");
      }

      if (hasErrors) {
        return;
      }

      modalSubmitBtn.disabled = true;
      modalSubmitBtn.textContent = "Saving...";

      const formData = new FormData(modalForm);
      const data = Object.fromEntries(formData.entries());
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
          location.reload();
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

  const modalOverlay = document.getElementById("addressModal");
  if (modalOverlay) {
    modalOverlay.addEventListener("mousedown", (e) => {
      if (e.target === modalOverlay) {
        closeAddressModal();
      }
    });
  }

  const addressForm = document.getElementById("addressForm");
  if (addressForm) {
    addressForm.addEventListener("submit", (e) => {
      const selectedAddress = document.querySelector('input[name="addressId"]:checked');
      
      if (!selectedAddress) {
        e.preventDefault();
        
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
