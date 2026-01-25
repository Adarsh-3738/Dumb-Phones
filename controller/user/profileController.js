
import User from "../../models/userSchema.js";
import bcrypt from "bcryptjs";
import { generateOtp, sendOtpEmail } from "../../services/user/userService.js";
import cloudinary from "../../config/cloudinary.js";
import streamifier from "streamifier";
import Address from "../../models/addressSchema.js";
// ----------------------
// PROFILE
// ----------------------

export const renderProfilePage = async (req, res) => {
  try {
    const user = req.user;

    const addressDoc = await Address.findOne({ userId: user._id });

    res.render("user/profile", {
      user,
      addresses: addressDoc ? addressDoc.address : []
    });

  } catch (error) {
    console.log(error);
    res.redirect("/login");
  }
};


// ----------------------
// EDIT PROFILE
// ----------------------


/* ================= GET EDIT PAGE ================= */
export const getEditProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
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

/* ================= POST SAVE CHANGES ================= */
export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) return res.redirect("/profile");

    // Update text fields
    user.name = name;
    user.phone = phone;

    // Upload image to Cloudinary
    if (req.file) {
      const result = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        {
          folder: "user_profiles",
          transformation: [
            { width: 300, height: 300, crop: "fill", gravity: "face" }
          ]
        }
      );
      user.profileImage = result.secure_url;
    }

    await user.save();

    // ✅ REDIRECT AFTER SAVE
    return res.redirect("/profile");

  } catch (error) {
    console.error(error);
    return res.redirect("/profile");
  }
};



// ---------------------- LOAD CHANGE EMAIL PAGE ----------------------
export const loadChangeEmail = (req, res) => {
  const user = req.session.user; // get logged-in user
  res.render("user/change-email", { user, message: null });
};


// ---------------------- SEND EMAIL OTP ----------------------
export const sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // Logged-in user
    const user = await User.findById(req.user._id);
    if (!user) return res.redirect("/profile");

    // Validation
    if (!email) {
      return res.render("user/change-email", {
        user,
        message: "Please enter a valid email address"
      });
    }

    // Same email check
    if (email === user.email) {
      return res.render("user/change-email", {
        user,
        message: "This is already your current email"
      });
    }

    // Duplicate email check
    const exists = await User.findOne({ email });
    if (exists) {
      return res.render("user/change-email", {
        user,
        message: "Email is already in use"
      });
    }

    // Generate OTP
    const otp = generateOtp();
console.log(`OTP for ${email}:`, otp);//for seeing in the terminal

    // Send OTP email
    await sendOtpEmail(email, otp);

    // Save OTP in session (temporary)
    req.session.emailChange = {
      newEmail: email,
      otp,
      createdAt: Date.now()
    };

    // Redirect to verify page
    res.redirect("/verify-email");

  } catch (error) {
    console.error("Send Email OTP Error:", error);

    res.render("user/change-email", {
      user: req.session.user,
      message: "Failed to send OTP. Please try again."
    });
  }
};
// ---------------------- LOAD VERIFY EMAIL PAGE ----------------------
export const loadVerifyEmail = (req, res) => {
  if (!req.session.emailChange) {
    return res.redirect("/change-email");
  }

  res.render("user/verify-email", { message: null });
};


// ---------------------- VERIFY EMAIL OTP ----------------------
export const verifyEmailOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!req.session.emailChange) {
      return res.redirect("/change-email");
    }

    const { newEmail, otp: sessionOtp, createdAt } =
      req.session.emailChange;

    // OTP expiry (5 minutes)
    const OTP_EXPIRY = 5 * 60 * 1000;
    if (Date.now() - createdAt > OTP_EXPIRY) {
      delete req.session.emailChange;
      return res.render("user/verify-email", {
        message: "OTP expired. Please request again."
      });
    }

    // OTP validation
    if (!otp || otp !== sessionOtp.toString()) {
      return res.render("user/verify-email", {
        message: "Invalid OTP"
      });
    }

    // ✅ UPDATE EMAIL
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { email: newEmail },
      { new: true }
    );

    // ✅ UPDATE SESSION (THIS IS CRITICAL)
    req.session.user.email = updatedUser.email;

    // Clear OTP session
    delete req.session.emailChange;

    return res.redirect("/profile");

  } catch (error) {
    console.error("Verify Email OTP Error:", error);
    return res.render("user/verify-email", {
      message: "Something went wrong. Please try again."
    });
  }
};


// ---------------------- CHANGE PASSWORD ----------------------
export const loadChangePassword = (req, res) => {
  res.render("user/change-password", { message: null });
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.redirect("/profile");

    // validate current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.render("user/change-password", {
        message: "Current password is incorrect"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.render("user/change-password", {
        message: "Passwords do not match"
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    // ✅ ALWAYS REDIRECT
    return res.redirect("/profile");

  } catch (error) {
    console.error(error);
    return res.redirect("/profile");
  }
};

/* ===================== LOAD ADDRESS LIST ===================== */
export const loadAddresses = async (req, res) => {
  try {
    const userAddressDoc = await Address.findOne({ userId: req.user._id });

    const addresses = userAddressDoc ? userAddressDoc.address : []; // get the array

    res.render("user/address", { addresses });

  } catch (error) {
    console.error(error);
    res.redirect("/profile");
  }
};


/* ===================== LOAD ADD ADDRESS PAGE ===================== */
export const loadAddAddress = (req, res) => {
  res.render("user/add-address", { message: null });
};


/* ===================== ADD ADDRESS ===================== */
export const addAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      addressType,
      name,
      city,
      landmark,
      state,
      pincode,
      phone,
      altPhone
    } = req.body;

    let addressDoc = await Address.findOne({ userId });

    const newAddress = {
      addressType,
      name,
      city,
      landmark,
      state,
      pincode: Number(pincode),
      phone,
      altPhone
    };

    if (addressDoc) {
      addressDoc.address.push(newAddress);
      await addressDoc.save();
    } else {
      await Address.create({
        userId,
        address: [newAddress]
      });
    }

    res.redirect("/address");
  } catch (error) {
    console.error(error);
    res.render("user/add-address", {
      message: "Failed to add address"
    });
  }
};

/* ===================== LOAD EDIT ADDRESS PAGE ===================== */
export const loadEditAddress = async (req, res) => {
  try {
    const addressDoc = await Address.findOne(
      { userId: req.user._id, "address._id": req.params.id },
      { "address.$": 1 }
    );

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


/* ===================== UPDATE ADDRESS ===================== */
export const updateAddress = async (req, res) => {
  try {
    const {
      addressType,
      name,
      city,
      landmark,
      state,
      pincode,
      phone,
      altPhone
    } = req.body;

    await Address.updateOne(
      { userId: req.user._id, "address._id": req.params.id },
      {
        $set: {
          "address.$.addressType": addressType,
          "address.$.name": name,
          "address.$.city": city,
          "address.$.landmark": landmark,
          "address.$.state": state,
          "address.$.pincode": Number(pincode),
          "address.$.phone": phone,
          "address.$.altPhone": altPhone
        }
      }
    );

    res.redirect("/address");
  } catch (error) {
    console.error(error);
    res.redirect("/address");
  }
};

/* ===================== DELETE ADDRESS ===================== */
export const deleteAddress = async (req, res) => {
  try {
    await Address.updateOne(
      { userId: req.user._id },
      { $pull: { address: { _id: req.params.id } } }
    );

    res.redirect("/address");
  } catch (error) {
    console.error(error);
    res.redirect("/address");
  }
};
// logout 
export const logoutUser = (req, res) => {
  try {
    req.session.destroy(err => {
      if (err) {
        console.error("Logout Error:", err);
        return res.redirect("/profile");
      }

      res.clearCookie("connect.sid"); // default express-session cookie
      return res.redirect("/login");
    });

  } catch (error) {
    console.error("Logout Catch Error:", error);
    return res.redirect("/login");
  }
};
