
import User from "../../models/userSchema.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();
// Find admin by email
export const findAdminByEmail = async (email) => {
  const admin = await User.findOne({ email, isAdmin: true });
  return admin;
};

// Compare password
export const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};










// PASSWORD & OTP
export const hashPassword = async (password) => await bcrypt.hash(password, 10);

export const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

export const sendOtpEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "Verify your account",
      text: `Your OTP is ${otp}`,
      html: `<b>Your OTP: ${otp}</b>`,
    });

    return info.accepted.length > 0;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};




//PASSWORD RESET 
export const generateResetToken = async (user) => {
  const resetToken = crypto.randomBytes(32).toString("hex");

  // HASH token before saving to DB
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour

  await user.save();

  const resetUrl = `http://localhost:3001/admin/reset-password/${resetToken}`;

  await sendResetEmail(user.email, resetUrl);

  return resetToken;
};

export const getUserByResetToken = async (token) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  return await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select("+password");  
};


export const resetUserPassword = async (user, newPassword) => {
  const hashed = await hashPassword(newPassword);

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    {
      password: hashed,
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined
    },
    { new: true }
  );

  console.log("Updated password:", updatedUser.password);
};


//email sent link to forgot password
export const sendResetEmail = async (toEmail, resetUrl) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // or SMTP service
    auth: {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PASSWORD,
    },
  });

  const mailOptions = {
    from: `"DumbPhones" <${process.env.NODEMAILER_EMAIL}>`,
    to: toEmail,
    subject: "Password Reset Request",
    html: `
      <p>You requested a password reset.</p>
      <p>Click this link to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link will expire in 1 hour.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};