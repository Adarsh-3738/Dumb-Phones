import STATUS_CODES from "../utils/statusCodes.js";
import logger from "../utils/logger.js";

const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || STATUS_CODES.INTERNAL_SERVER_ERROR;

  logger.error("Global Error Handler", {
    message: err.message,
    stack: err.stack,
    statusCode,
  });

  // API response
  if (req.originalUrl.startsWith("/api")) {
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Something went wrong",
    });
  }

  // Render error page (for views)
  return res.status(statusCode).render("admin-error", {
    message: err.message || "Something went wrong",
  });
};

export default errorMiddleware;

//example 
//export const logout = asyncHandler(async (req, res) => {
//   const adminId = req.session?.admin?.id;

//   req.session.destroy((err) => {
//     if (err) {
//       throw new AppError("Logout failed", STATUS_CODES.INTERNAL_SERVER_ERROR);
//     }

//     logger.info("Admin logged out", { adminId });
//     res.redirect("/admin/login");
//   });
// });





// in the app.js 
// import errorMiddleware from "./middlewares/errorMiddleware.js";

// app.use(errorMiddleware);