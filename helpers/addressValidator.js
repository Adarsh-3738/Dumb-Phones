export const validateAddress = (data) => {
  const errors = {};

  // Address Type
  if (data.addressType) {
    data.addressType = data.addressType.trim();
    data.addressType = data.addressType.charAt(0).toUpperCase() + data.addressType.slice(1).toLowerCase();
  }

  if (!data.addressType || !["Home", "Office"].includes(data.addressType)) {
    errors.addressType = "Address type must be 'Home' or 'Office'";
  }

  // Name
  if (!data.name || data.name.trim().length < 3) {
    errors.name = "Full name must be at least 3 characters";
  }
  if (data.name && !/^[A-Za-z ]+$/.test(data.name)) {
    errors.name = "Name can contain only letters and spaces";
  }

  // Phone
  if (!data.phone || !/^\d{10}$/.test(data.phone)) {
    errors.phone = "Phone number must be 10 digits";
  }

  // Alternate Phone 
  if (data.altPhone && !/^\d{10}$/.test(data.altPhone)) {
    errors.altPhone = "Alternate phone must be 10 digits";
  }

  // Landmark
  if (!data.landmark || data.landmark.trim().length < 3) {
    errors.landmark = "Landmark must be at least 3 characters";
  }

  // City
  if (!data.city || data.city.trim().length < 2) {
    errors.city = "City is required";
  }

  // State
  if (!data.state || data.state.trim().length < 2) {
    errors.state = "State is required";
  }

  // Pincode
  if (!data.pincode || !/^\d{6}$/.test(data.pincode.toString())) {
    errors.pincode = "Pincode must be 6 digits";
  }

  const isValid = Object.keys(errors).length === 0;

  return { isValid, errors };
};
