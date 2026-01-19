
import User from "../../models/userSchema.js";
import bcrypt from "bcrypt";

// Find admin by email
export const findAdminByEmail = async (email) => {
  const admin = await User.findOne({ email, isAdmin: true });
  return admin;
};

// Compare password
export const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};
