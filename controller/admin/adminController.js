const User = require("../../models/userSchema");
const bcrypt = require("bcrypt");

const pageerror = async (req, res) => {
  res.render("admin-error");
};

const loadLogin = (req, res) => {
  if (req.session.admin) {
    return res.redirect("/admin/dashboard");
  }
  res.render("admin/login", { message: null });
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({ email, isAdmin: true });

    if (!admin) {
      return res.redirect("/admin/login");
    }

    const passwordMatch = await bcrypt.compare(password, admin.password);

    if (!passwordMatch) {
      return res.redirect("/admin/login");
    }

    // Save admin session
    req.session.admin = {
      id: admin._id,
      email: admin.email
    };

    return res.redirect("/admin/dashboard");

  } catch (error) {
    console.error("Login error:", error);
    return res.redirect("/pageerror");
  }
  

};




const loadDashboard = async (req, res) => {
  try {
    if (!req.session.admin) {
      return res.redirect("/admin/login");
    }
    res.render("admin/dashboard");
  } catch (error) {
    console.log("Dashboard error:", error);
    res.redirect("/admin/pageerror");
  }
};





const logout = async (req,res)=>{
try {
req.session.destroy(err =>{
if(err){
console.log ("Error destroying session",err);
return res. redirect ("/pageerror");
}
res. redirect ("/admin/login");
})
}catch(error) {
console.log (("unexpected error during logout",error))

res. redirect ("/pageerror")
}}

module.exports = {
  loadLogin,
  login,
  loadDashboard,
  pageerror,
  logout,
};
