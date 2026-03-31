import express from "express";
import dotenv from "dotenv";
import path from "path";
import session from "express-session";
import passport from "./config/passport.js";
import userRouter from "./routes/userRouter.js";
import adminRouter from "./routes/adminRouter.js";
import db from "./config/db.js";
import { fileURLToPath } from "url";

import Cart from "./models/cartSchema.js";
import User from "./models/userSchema.js";
import Wishlist from "./models/wishlistSchema.js";

// user profile
import cookieParser from "cookie-parser";


import methodOverride from "method-override";
import { initCronJobs } from "./utils/cronJobs.js";





dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cookieParser());
// DB
db();

// Header search defaults
app.use((req, res, next) => {
  res.locals.search = "";
  res.locals.sort = "";
  res.locals.brand = "";
  res.locals.category = "";
  res.locals.price = "";
  next();
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cache control
app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "-1");
  next();
});

// Session
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

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Make logged-in user available in all EJS views
// Make logged-in user and cart count available in all EJS views
app.use(async (req, res, next) => {
  let sessionUser = req.user || req.session.user;
  res.locals.user = null;
  res.locals.cartCount = 0;
  res.locals.wishlistCount = 0;

  if (sessionUser) {
    try {
      // Check live database status to ensure user isn't blocked manually from admin
      const liveUser = await User.findById(sessionUser._id || sessionUser);
      
      if (!liveUser || liveUser.isBlocked) {
        const finishLogout = () => {
          if (req.session) {
            delete req.session.user;
            delete req.session.passport;
            return req.session.save((err) => {
              if (err) console.log("Session save error:", err);
              return next();
            });
          }
          return next();
        };

        if (req.logout) {
          const adminSession = req.session ? req.session.admin : null;
          return req.logout({ keepSessionInfo: true }, (err) => {
            if (err) console.log("Passport logout error:", err);
            if (req.session && adminSession) {
               req.session.admin = adminSession;
            }
            finishLogout();
          });
        } else {
          return finishLogout();
        }
      }

      res.locals.user = liveUser;
      
      const cart = await Cart.findOne({ userId: liveUser._id });
      if (cart) {
        // This sums up the quantity of all items in the cart
        res.locals.cartCount = cart.items.reduce((total, item) => total + item.quantity, 0);
      }
      
      const wishlist = await Wishlist.findOne({ userId: liveUser._id });
      if (wishlist) {
        res.locals.wishlistCount = wishlist.products.length;
      }
    } catch (err) {
      console.log("Error fetching user or cart status:", err);
    }
  }
  next();
});


// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static
app.use(express.static(path.join(__dirname, "public")));


app.use(methodOverride('_method')); // looks for _method query or hidden input


// Routes
app.use("/", userRouter);
app.use("/admin", adminRouter);

// Serve static files from uploads folder
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));




// Server
app.listen(process.env.PORT, () => {
  console.log("Server running on port", process.env.PORT);
  initCronJobs();
});

export default app;
