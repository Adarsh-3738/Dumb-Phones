import express from "express";
import dotenv from "dotenv";
import path from "path";
import session from "express-session";
import MongoStore from "connect-mongo";
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
import STATUS_CODES from "./utils/statusCodes.js";





import { globalLimiter, authLimiter } from "./middlewares/rateLimiter.js";

dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);
app.use(globalLimiter);
app.use("/login", authLimiter);
app.use("/signup", authLimiter);
app.use("/verify-otp", authLimiter);
app.use("/forgot-password", authLimiter);
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
    secret: process.env.SESSION_SECRET || "default_session_secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/dumbphones",
      ttl: 72 * 60 * 60
    }),
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
  if (req.path.startsWith("/admin") || req.path === "/auth/check-status") {
    return next();
  }

  let sessionUser = req.user || req.session.user;
  res.locals.user = null;
  res.locals.cartCount = 0;
  res.locals.wishlistCount = 0;
  res.locals.wishlistedProducts = [];

  if (sessionUser) {
    try {
      // Check live database status to ensure user isn't blocked manually from admin
      const liveUser = await User.findById(sessionUser._id || sessionUser);
      
      if (!liveUser || liveUser.isBlocked) {
        const finishLogout = () => {
          if (req.session) {
            delete req.session.user;
            delete req.session.passport;
            
            // Set message for login page SweetAlert
            req.session.message = "Your account has been blocked by the administrator.";
            
            return req.session.save((err) => {
              if (err) console.log("Session save error:", err);
              
              // Handle AJAX requests
              if (req.xhr || (req.headers.accept && req.headers.accept.includes("json"))) {
                return res.status(STATUS_CODES.FORBIDDEN).json({ success: false, blocked: true, message: req.session.message });
              }
              return res.redirect("/login");
            });
          }
          
          if (req.xhr || (req.headers.accept && req.headers.accept.includes("json"))) {
            return res.status(STATUS_CODES.FORBIDDEN).json({ success: false, blocked: true, message: "Your account has been blocked by the administrator." });
          }
          return res.redirect("/login");
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
      
      const wishlist = await Wishlist.findOne({ userId: liveUser._id })
        .populate({
          path: "products.productId",
          populate: { path: "category" }
        });
      if (wishlist) {
        const validProducts = wishlist.products.filter(item => {
          const product = item.productId;
          return (
            product &&
            !product.isBlocked &&
            product.category &&
            product.category.isListed &&
            !product.category.isDeleted &&
            product.status !== "Discontinued"
          );
        });
        res.locals.wishlistCount = validProducts.length;
        res.locals.wishlistedProducts = validProducts.map(p => p.productId._id.toString());
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

// 404 Not Found Handler
app.use((req, res) => {
  if (req.xhr || (req.headers.accept && req.headers.accept.includes("json"))) {
    return res.status(STATUS_CODES.NOT_FOUND).json({
      success: false,
      message: "Resource not found"
    });
  }

  if (req.originalUrl.startsWith("/admin")) {
    return res.status(STATUS_CODES.NOT_FOUND).render("admin/admin-error", {
      statusCode: 404,
      title: "404 - Page Not Found",
      message: "The admin page or resource you requested does not exist."
    });
  }

  return res.status(STATUS_CODES.NOT_FOUND).render("user/page-404", {
    statusCode: 404,
    title: "404 - Page Not Found",
    message: "Oops! The page you're looking for doesn't exist."
  });
});

// 500 Internal Server Error Handler
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", err);

  if (req.xhr || (req.headers.accept && req.headers.accept.includes("json"))) {
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message || "An internal server error occurred"
    });
  }

  if (req.originalUrl && req.originalUrl.startsWith("/admin")) {
    return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).render("admin/admin-error", {
      statusCode: 500,
      title: "500 - Server Error",
      message: err.message || "An unexpected error occurred. Please try again."
    });
  }

  return res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).render("user/page-404", {
    statusCode: 500,
    title: "500 - Server Error",
    message: "Something went wrong on our end. Please try again later."
  });
});

// Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
  initCronJobs();
});

export default app;
