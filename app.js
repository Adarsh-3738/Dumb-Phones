const express = require("express");
const app = express();
const env = require("dotenv").config();
const path = require("path");
const session = require("express-session");
const passport = require("./config/passport");
const userRouter = require("./routes/userRouter");
const adminRouter = require("./routes/adminRouter");
const db = require("./config/db");
db();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 72 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize ());
app.use(passport.session());




app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "public")));

// ONLY THIS IS NEEDED
app.use("/", userRouter);
 app.use("/admin",adminRouter);



app.listen(process.env.PORT, () => {
  console.log("server is running");
});

module.exports = app;
