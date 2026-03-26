import {
  getUserById,
  getUserAddresses,
  updateUserProfile,
  checkEmailExists,
  updateUserEmail,
  comparePassword,
  updatePassword,
  getAddresses,
  addNewAddress,
  getSingleAddress,
  updateUserAddress,
  deleteUserAddress
} from "../../services/user/profileService.js";

import { generateOtp, sendOtpEmail } from "../../services/user/userService.js";
import cloudinary from "../../config/cloudinary.js";
import streamifier from "streamifier";
import { validateAddress } from "../../helpers/addressValidator.js";
import crypto from "crypto";



// PROFILE


export const renderProfilePage = async (req, res) => {
  try {

    let user = req.user || req.session.user;
    
    if (!user) return res.redirect("/login");

    const dbUser = await getUserById(user._id);
    if (dbUser && !dbUser.referalCode) {
      dbUser.referalCode = crypto.randomBytes(3).toString("hex").toUpperCase();
      await dbUser.save();
      // Update session user for consistency
      if (req.session && req.session.user) {
        req.session.user.referalCode = dbUser.referalCode;
      }
    }
    
    user = dbUser || user;

    const addressDoc = await getUserAddresses(user._id);

    res.render("user/profile", {
      user,
      addresses: addressDoc ? addressDoc.address : []
    });

  } catch (error) {
    console.log(error);
    res.redirect("/login");
  }
};



// EDIT PROFILE


export const getEditProfile = async (req, res) => {
  try {

    const user = await getUserById(req.user._id);

    if (!user) return res.redirect("/profile");

    res.render("user/edit-profile", {
      user,
      message: null
    });

  } catch (error) {
    console.error(error);
    res.redirect("/profile");
  }
};



// UPDATE PROFILE


export const updateProfile = async (req, res) => {

  try {

    const { name, phone, removeImage } = req.body;

    const user = await getUserById(req.user._id);

    if (!user) return res.redirect("/profile");

    // NAME VALIDATION
    if (!name || name.trim().length < 3) {
      return res.render("user/edit-profile", {
        user,
        message: "Name must be at least 3 characters long",
      });
    }

    if (!/^[A-Za-z0-9 ]+$/.test(name)) {
      return res.render("user/edit-profile", {
        user,
        message: "Name can contain only letters, numbers and spaces",
      });
    }

    // PHONE VALIDATION
    if (!phone) {
      return res.render("user/edit-profile", {
        user,
        message: "Phone number is required",
      });
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      return res.render("user/edit-profile", {
        user,
        message: "Phone number must be exactly 10 digits",
      });
    }

    let imageUrl = user.profileImage;

    if (removeImage === "true") {
      imageUrl = ""; // Empty string acts as generic fallback trigger in UI
    }

    if (req.file) {

      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.render("user/edit-profile", {
          user,
          message: "Only JPG, PNG, or WEBP images are allowed",
        });
      }

      if (req.file.size > 2 * 1024 * 1024) {
        return res.render("user/edit-profile", {
          user,
          message: "Profile image must be under 2MB",
        });
      }

      const streamUpload = (fileBuffer) => {

        return new Promise((resolve, reject) => {

          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "user_profiles",
              transformation: [
                { width: 300, height: 300, crop: "fill", gravity: "face" },
              ],
            },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );

          streamifier.createReadStream(fileBuffer).pipe(stream);

        });

      };

      try {

        const result = await streamUpload(req.file.buffer);

        imageUrl = result.secure_url;

      } catch (err) {

        console.error("Cloudinary upload failed:", err);

        return res.render("user/edit-profile", {
          user,
          message: "Failed to upload profile image. Try again.",
        });

      }

    }

    const updatedUser = await updateUserProfile(req.user._id, {
      name: name.trim(),
      phone,
      profileImage: imageUrl
    });

    if (req.session && req.session.user) {
      req.session.user.name = updatedUser.name;
      req.session.user.phone = updatedUser.phone;
      req.session.user.profileImage = updatedUser.profileImage;
    }

    return res.redirect("/profile?success=profile_updated");

  } catch (error) {

    console.error("Update Profile Error:", error);

    return res.render("user/edit-profile", {
      user: req.user,
      message: "Something went wrong. Please try again.",
    });

  }

};



// LOAD CHANGE EMAIL PAGE


export const loadChangeEmail = (req, res) => {

  const user = req.session.user;

  res.render("user/change-email", { user, message: null });

};



// SEND EMAIL OTP


export const sendEmailOtp = async (req, res) => {

  try {

    const { email } = req.body;

    const user = await getUserById(req.user._id);

    if (!user) return res.redirect("/profile");

    if (!email) {

      return res.render("user/change-email", {
        user,
        message: "Please enter a valid email address"
      });

    }

    if (email === user.email) {

      return res.render("user/change-email", {
        user,
        message: "This is already your current email"
      });

    }

    const exists = await checkEmailExists(email);

    if (exists) {

      return res.render("user/change-email", {
        user,
        message: "Email is already in use"
      });

    }

    const otp = generateOtp();

    console.log(`OTP for ${email}:`, otp);

    await sendOtpEmail(email, otp);

    req.session.emailChange = {
      newEmail: email,
      otp,
      createdAt: Date.now()
    };

    res.redirect("/email/verify");

  } catch (error) {

    console.error("Send Email OTP Error:", error);

    res.render("user/change-email", {
      user: req.session.user,
      message: "Failed to send OTP. Please try again."
    });

  }

};



// LOAD VERIFY EMAIL PAGE


export const loadVerifyEmail = (req, res) => {

  if (!req.session.emailChange) {
    return res.redirect("/email/change");
  }

  res.render("user/verify-email", { message: null });

};



// VERIFY EMAIL OTP


export const verifyEmailOtp = async (req, res) => {

  try {

    const { otp } = req.body;

    if (!req.session.emailChange) {
      return res.redirect("/email/change");
    }

    const { newEmail, otp: sessionOtp, createdAt } = req.session.emailChange;

    const OTP_EXPIRY = 5 * 60 * 1000;

    if (Date.now() - createdAt > OTP_EXPIRY) {

      delete req.session.emailChange;

      return res.render("user/verify-email", {
        message: "OTP expired. Please request again."
      });

    }

    if (!otp || otp !== sessionOtp.toString()) {

      return res.render("user/verify-email", {
        message: "Invalid OTP"
      });

    }

    const updatedUser = await updateUserEmail(req.user._id, newEmail);

    req.session.user.email = updatedUser.email;

    delete req.session.emailChange;

    return res.redirect("/profile?emailChanged=true");

  } catch (error) {

    console.error("Verify Email OTP Error:", error);

    return res.render("user/verify-email", {
      message: "Something went wrong. Please try again."
    });

  }

};



// RESEND EMAIL OTP


export const resendEmailOtp = async (req, res) => {

  try {

    if (!req.session.emailChange) {
      return res.status(400).json({ success: false, message: 'No email to verify' });
    }

    const { newEmail } = req.session.emailChange;

    const otp = generateOtp();

    console.log(`Resend OTP for ${newEmail}:`, otp);

    req.session.emailChange.otp = otp;
    req.session.emailChange.createdAt = Date.now();

    await sendOtpEmail(newEmail, otp);

    return res.json({ success: true });

  } catch (error) {

    console.error("Resend OTP Error:", error);

    return res.status(500).json({ success: false, message: 'Failed to send OTP' });

  }

};



// CHANGE PASSWORD


export const loadChangePassword = (req, res) => {

  res.render("user/change-password", { message: null });

};


export const changePassword = async (req, res) => {
  try {

    const { currentPassword, newPassword, confirmPassword } = req.body;

    const user = await getUserById(req.user._id);

    if (!user) {
      return res.status(401).json({ success: false, message: "User not found. Please log in again." });
    }

    const isMatch = await comparePassword(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "New passwords do not match." });
    }

    await updatePassword(user, newPassword);

    return res.status(200).json({ success: true, message: "Password changed successfully." });

  } catch (error) {

    console.error(error);

    return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });

  }
};

// LOAD ADDRESS LIST


export const loadAddresses = async (req, res) => {

  try {

    const addressDoc = await getAddresses(req.user._id);

    const addresses = addressDoc ? addressDoc.address : [];

    res.render("user/address", { addresses });

  } catch (error) {

    console.error(error);

    res.redirect("/profile");

  }

};



// LOAD ADD ADDRESS PAGE

export const loadAddAddress = (req, res) => {

  res.render("user/add-address", { message: null });

};

// ADD ADDRESS

export const addAddress = async (req, res) => {

  try {

    const userId = req.user._id;

    const newAddress = req.body;

    const { isValid, errors } = validateAddress(newAddress);

    if (!isValid) {

      return res.render("user/add-address", {
        message: Object.values(errors).join(", ")
      });

    }

    newAddress.pincode = Number(newAddress.pincode);

    await addNewAddress(userId, newAddress);

    res.redirect("/address?success=added");

  } catch (error) {

    console.error(error);

    res.render("user/add-address", {
      message: "Failed to add address"
    });

  }

};



// LOAD EDIT ADDRESS PAGE
export const loadEditAddress = async (req, res) => {

  try {

    const addressDoc = await getSingleAddress(req.user._id, req.params.id);

    if (!addressDoc) return res.redirect("/address");

    res.render("user/edit-address", {
      address: addressDoc.address[0],
      message: null
    });

  } catch (error) {

    console.error(error);

    res.redirect("/address");

  }

};

// UPDATE ADDRESS

export const updateAddress = async (req, res) => {

  try {

    const updatedAddress = req.body;

    updatedAddress._id = req.params.id;

    const { isValid, errors } = validateAddress(updatedAddress);

    if (!isValid) {

      return res.render("user/edit-address", {
        address: updatedAddress,
        message: Object.values(errors).join(", ")
      });

    }

    updatedAddress.pincode = Number(updatedAddress.pincode);

    await updateUserAddress(req.user._id, req.params.id, updatedAddress);

    res.redirect("/address?success=updated");

  } catch (error) {

    console.error(error);

    res.render("user/edit-address", {
      address: req.body,
      message: "Failed to update address"
    });

  }

};

// DELETE ADDRESS

export const deleteAddress = async (req, res) => {

  try {

    await deleteUserAddress(req.user._id, req.params.id);

    res.redirect("/address?success=deleted");

  } catch (error) {

    console.error(error);

    res.redirect("/address");

  }

};

// LOGOUT

export const logoutUser = (req, res) => {

  try {

    if (req.session) {
      delete req.session.user;
      delete req.session.passport;
      req.session.save(err => {
        if (err) {
          console.error("Logout Error:", err);
          return res.redirect("/profile");
        }
        res.clearCookie("connect.sid");
        return res.redirect("/login");
      });
    } else {
      res.clearCookie("connect.sid");
      return res.redirect("/login");
    }

  } catch (error) {

    console.error("Logout Catch Error:", error);

    return res.redirect("/login");

  }

};