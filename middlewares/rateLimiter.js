import rateLimit from "express-rate-limit";

// 1. General Site Rate Limiter (300 requests per 15 minutes per IP)
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes."
});

// 2. Sensitive Auth / OTP Limiter (15 requests per 15 minutes per IP for login/signup/OTP/reset)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 login/OTP attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many authentication attempts from this IP. Please try again after 15 minutes."
});
