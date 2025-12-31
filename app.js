const express = require("express");
const app = express();
const env = require("dotenv").config();
const path = require("path");
const session = require("express-session");
const passport = require("./config/passport");

// Routers
const userRouter = require("./routes/userRouter");
const adminRouter = require("./routes/adminRouter");

// DB
const db = require("./config/db");
db();

// ----- Middlewares -----
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ----- Session -----
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 72 * 60 * 60 * 1000
    }
  })
);

// ----- Passport -----
app.use(passport.initialize());
app.use(passport.session());

// ----- View Engine -----
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ----- Static -----
app.use(express.static(path.join(__dirname, "public")));

// -------------------- ROUTES -------------------------

// USER SIDE
app.use("/", userRouter);

// ADMIN MAIN ROUTES (Dashboard, Login, Categories, Brands, etc.)
app.use("/admin", adminRouter);



// ------------------------------------------------------

// SERVER
app.listen(process.env.PORT, () => {
  console.log("server is running on port", process.env.PORT);
});

module.exports = app;
