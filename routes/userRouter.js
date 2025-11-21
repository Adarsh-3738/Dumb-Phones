const express = require("express");
const router = express.Router();
const userController = require("../controller/user/userController");
const { loadLoginpage } = require("../controller/user/userController");

router.get("/",userController.loadLoginpage);

module.exports = router;