const User = require("../../models/userSchema");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
require("dotenv").config();

// PAGE NOT FOUND
const pageNotFound = async (req, res) => {
  try {
    res.render("user/page-404");
  } catch (error) {
    res.redirect("/pageNotFound");
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

// SIGNUP HANDLER
const signup = async (req, res) => {
  try {
    const { name, phone, email, password, confirmPassword } = req.body;

    // ✔ FIX 1: Matching signup field names
    if (password !== confirmPassword) {
      return res.render("user/signup", { message: "Passwords do not match" });
    }

    const findUser = await User.findOne({ email });
    if (findUser) {
      return res.render("user/signup", {
        message: "User with this email already exists",
      });
    }

    const otp = generateOtp();
    const emailSent = await sendVerificationEmail(email, otp);

    if (!emailSent) {
      return res.render("user/signup", { message: "Email sending failed" });
    }

    // store in session
    req.session.userOtp = otp;
    req.session.userData = { name, phone, email, password };

    console.log("OTP Sent:", otp);

    // ✔ FIX 2: Render verify-otp page
    return res.render("user/verify-otp", { message: "" });
  } catch (error) {
    console.error("signup error", error);
    res.redirect("/pageNotFound");
  }
};

// HASH PASSWORD
const securePassword = async (password) => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {}
};

// VERIFY OTP
const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    // ✔ FIX 3: Handle wrong OTP
    if (otp !== req.session.userOtp) {
      return res.render("user/verify-otp", { message: "Invalid OTP" });
    }

    const userData = req.session.userData;
    const passwordHash = await securePassword(userData.password);

    const newUser = new User({
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      password: passwordHash,
    });

    await newUser.save();
    req.session.user = newUser._id;

    // ✔ FIX 4: Cleanup session after successful OTP
    delete req.session.userOtp;
    delete req.session.userData;

    return res.redirect("/");
  } catch (error) {
    console.error("Error Verifying OTP", error);
    res.status(500).send("Error verifying OTP");
  }
};


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



const login = async (req, res)=>{
  try {
const {email, password} = req.body;
const findUser = await User.findOne({isAdmin:0, email:email});
if(!findUser){
return res. render("user/login", {message: "User not found"})
}
if(findUser.isBlocked){
 return res. render ("user/login",{message: "User is blocked by admin"})
}
const passwordMatch = await bcrypt.compare(password, findUser.password);
if(!passwordMatch) {
return res.render ("user/login", {message: "Incorrect Password"})
}
req.session.user = findUser._id;
res.redirect("/")

}
catch (error) {
    console.error ("login error" ,error);
res, render ("login", {message: "login failed. Please try again later"})
}
}

const logout = async (req, res)=>{
try {
req.session.destroy ((err)=>{
if(err){
console.log("Session destruction error", err.message) ;
return res.redirect("/pageNotFound");
}
return res.redirect ("/login" )
})
}catch (error) {
console.log ("Logout error", error);
res.redirect("user/pageNotFound" )
}
}

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
