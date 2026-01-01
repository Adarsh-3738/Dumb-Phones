// signup
exports.validateSignup = ({ name, phone, email, password, cPassword }) => {

  name = name?.trim();
  phone = phone?.trim();
  email = email?.trim();

  const nameRegex = /^[A-Za-z]+(?:\s[A-Za-z]+)*$/;
  const phoneRegex = /^[6-9]\d{9}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

  if (!name || name.length < 3 || !nameRegex.test(name)) {
    return "Enter a valid name (min 3 letters, alphabets only)";
  }

  if (!phone || !phoneRegex.test(phone)) {
    return "Enter a valid 10-digit phone number";
  }

  if (!email || !emailRegex.test(email)) {
    return "Enter a valid email address";
  }

  if (!password || !passwordRegex.test(password)) {
    return "Password must be at least 8 characters and include uppercase, lowercase, number, and special character";
  }

  if (password !== cPassword) {
    return "Passwords do not match";
  }

  return null; //validation passed
};



// login
const { body } = require("express-validator");

exports.loginValidation = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email"),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
];
