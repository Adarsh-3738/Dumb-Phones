import express from "express";
import dotenv from "dotenv";
import path from "path";
import session from "express-session";
import passport from "./config/passport.js";
import userRouter from "./routes/userRouter.js";
import adminRouter from "./routes/adminRouter.js";
import db from "./config/db.js";
import { fileURLToPath } from "url";

dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

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
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static
app.use(express.static(path.join(__dirname, "public")));

// Cache control
app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// Routes
app.use("/", userRouter);
app.use("/admin", adminRouter);

// Server
app.listen(process.env.PORT, () => {
  console.log("Server running on port", process.env.PORT);
});

export default app;
