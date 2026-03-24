import express from "express";
import * as profileController from "../../controller/user/profileController.js";
import protect from "../../middlewares/protect.js";
import upload from "../../middlewares/upload.js";

const router = express.Router();

router.get("/profile", protect, profileController.renderProfilePage);

router.get("/profile/edit", protect, profileController.getEditProfile);
router.patch(
  "/profile/edit",
  protect,
  upload.single("profileImage"),
  profileController.updateProfile
);

router.get("/email/change", protect, profileController.loadChangeEmail);
router.post("/email/change", protect, profileController.sendEmailOtp);
router.post("/resend/otp", protect, profileController.resendEmailOtp);
router.get("/email/verify", protect, profileController.loadVerifyEmail);
router.post("/email/verify", protect, profileController.verifyEmailOtp);

router.get("/change-password", protect, profileController.loadChangePassword);
router.patch("/change-password", protect, profileController.changePassword);

router.get("/address", protect, profileController.loadAddresses);
router.get("/address/add", protect, profileController.loadAddAddress);
router.post("/address/add", protect, profileController.addAddress);
router.get("/address/edit/:id", protect, profileController.loadEditAddress);
router.patch("/address/edit/:id", protect, profileController.updateAddress);
router.delete("/address/delete/:id", protect, profileController.deleteAddress);

router.post("/logout", protect, profileController.logoutUser);

export default router;
