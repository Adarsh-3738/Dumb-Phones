const User = require("../../models/userSchema");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
require("dotenv").config();

// PAGE NOT FOUND
const pageNotFound = async (req, res) => {
  try {
    res.render("user/page-404");
  } catch (error) {
    res.redirect("user/pageNotFound");
  }
};

// HOME PAGE
const loadHomepage = async (req, res) => {
  try {
    const user = req.session.user;
    if(user){
        const userData = await User.findOne({_id:user._id});
        res.render("user/home",{user:userData})

    }
    else{
        return res.render("user/home");
    }
  } catch (error) {
    console.log("Home page not found");
    res.status(500).send("server error");
  }
};

// LOAD SIGNUP
const loadSignup = async (req, res) => {
  try {
    res.render("user/signup");
  } catch (error) {
    res.status(500).send("Server Error");
  }
};

// OTP GENERATOR
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// SEND OTP EMAIL
async function sendVerificationEmail(email, otp) {
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
    console.error("Error sending email", error);
    return false;
  }
}



// SIGNUP (SEND OTP)
const signup = async (req, res) => {
    try {
        const { name, phone, email, password, cPassword } = req.body;

        if (password !== cPassword) {
            return res.render("user/signup", { message: "Passwords do not match" });
        }

        const findUser = await User.findOne({ email });
        if (findUser) {
            return res.render("user/signup", { message: "User already exists with this email" });
        }

        const otp = generateOtp();
        const emailSent = await sendVerificationEmail(email, otp);

        if (!emailSent) {
            return res.json("email-error");
        }

        req.session.userOtp = otp;
        req.session.userData = { name, phone, email, password };

        console.log("OTP sent:", otp);

        return res.render("user/verify-otp");
    } catch (error) {
        console.error("Signup error", error);
        res.redirect("/user/page-404");
    }
};

// HASH PASSWORD
const securePassword = async (password) => {
    try {
        return await bcrypt.hash(password, 10);
    } catch {
        throw new Error("Password hashing failed");
    }
};

// VERIFY OTP
const verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;

        if (!req.session.userOtp) {
            return res.json({
                success: false,
                message: "OTP expired. Please request a new one.",
            });
        }

        if (otp !== req.session.userOtp.toString()) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP. Please try again",
            });
        }

        const user = req.session.userData;
        const passwordHash = await securePassword(user.password);

        const saveUserData = new User({
            name: user.name,
            email: user.email,
            phone: user.phone,
            password: passwordHash,
        });

        await saveUserData.save();

        delete req.session.userOtp;
        delete req.session.userData;

        req.session.user = saveUserData._id;

        return res.json({
            success: true,
            redirectUrl: "/login",
        });
    } catch (error) {
        console.error("Error verifying OTP", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while verifying OTP",
        });
    }
};

// RESEND OTP
const resendOtp = async (req, res) => {
    try {
        if (!req.session.userData || !req.session.userData.email) {
            return res.json({
                success: false,
                message: "Session expired. Please signup again.",
            });
        }

        const newOtp = generateOtp();
        req.session.userOtp = newOtp;

        const emailSent = await sendVerificationEmail(req.session.userData.email, newOtp);

        if (!emailSent) {
            return res.json({
                success: false,
                message: "Failed to resend OTP. Try again.",
            });
        }

        console.log("New OTP Sent:", newOtp);

        return res.json({
            success: true,
            message: "New OTP sent successfully!",
        });
    } catch (error) {
        console.log("Resend OTP error:", error);
        return res.json({
            success: false,
            message: "Something went wrong",
        });
    }
};




// const signup = async (req, res) => {
//   try {
//     const { name, phone, email, password, confirmPassword } = req.body;
// console.log(req.body)
//     //Matching signup field names
//     if (password !== confirmPassword) {
//       return res.render("user/signup", { message: "Passwords do not match" });
//     }

//     const findUser = await User.findOne({ email });
//     if (findUser) {
//       return res.render("user/signup", {
//         message: "User with this email already exists",
//       });
//     }

//     const otp = generateOtp();
//     const emailSent = await sendVerificationEmail(email, otp);

//     if (!emailSent) {
//       return res.render("user/signup", { message: "Email sending failed" });
//     }

//     // store in session
//     req.session.userOtp = otp;
//     req.session.userData = { name, phone, email, password };

//     console.log("OTP Sent:", otp);

//     //Render verify-otp page
//     return res.render("user/verify-otp", { message: "" });
//   } catch (error) {
//     console.error("signup error", error);
//     res.redirect("/pageNotFound");
//   }
// };


// PASSWORD HASH FUNCTION
// const securePassword = async (password) => {
//     try {
//         const passwordHash = await bcrypt.hash(password, 10);
//         return passwordHash;
//     } catch (error) {
//         throw new Error("Password hashing failed");
//     }
// };

// VERIFY OTP
// const verifyOtp = async (req, res) => {
//     try {
//         const { otp } = req.body;

//         console.log("Entered OTP:", otp);
//         console.log("Stored OTP:", req.session.userOtp);

//         if (!req.session.userOtp) {
//             return res.json({
//                 success: false,
//                 message: "OTP expired. Please request a new one.",
//             });
//         }

//         if (otp !== req.session.userOtp.toString()) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid OTP. Please try again",
//             });
//         }

        // OTP MATCHED
//         const user = req.session.userData;

//         const passwordHash = await securePassword(user.password);

//         const saveUserData = new User({
//             name: user.name,
//             email: user.email,
//             phone: user.phone,
//             password: passwordHash,
//         });

//         await saveUserData.save();

//         // Clear session data
//         delete req.session.userOtp;
//         delete req.session.userData;

//         req.session.user = saveUserData._id;

//         return res.json({
//             success: true,
//             redirectUrl: "/login",
//         });
//     } catch (error) {
//         console.error("Error verifying OTP", error);
//         res.status(500).json({
//             success: false,
//             message: "An error occurred while verifying OTP",
//         });
//     }
// };

const loadLogin = async (req,res)=>{
    try{
        if(!req.session.user){
            return res.render("user/login")
        }
        else{
            res.redirect("/")
        }

    } catch(error){
       res.redirect("/pageNotFound") 
    }
}



const login = async (req, res) => {
  try {
    const { email, password } = req.body;
console.log(req.body)
    const findUser = await User.findOne({ isAdmin: false, email });

    if (!findUser) {
      return res.render("user/login", { message: "User not found" });
    }

    if (findUser.isBlocked) {
      return res.render("user/login", { message: "User is blocked by admin" });
    }

    const passwordMatch = await bcrypt.compare(password, findUser.password);
    if (!passwordMatch) {
      return res.render("user/login", { message: "Incorrect Password" });
    }

    // STORE SESSION
    req.session.user = { _id: findUser._id };
console.log(req.session.user)
    return res.redirect("/");
  } catch (error) {
    console.error("login error", error);
    return res.render("user/login", { message: "Login failed. Please try again later" });
  }
};


const logout = async (req,res)=>{
try {
req.session.destroy(err =>{
if(err){
console.log ("Error destroying session",err);
return res.redirect ("/pageerror");
}
res.redirect ("/login");
})
}catch(error) {
console.log (("unexpected error during logout",error))

res. redirect ("/pageerror")
}}

module.exports = {
  loadHomepage,
  pageNotFound,
  loadSignup,
  signup,
  verifyOtp,
  loadLogin,
  login,
  logout,
}
