// routes/adminWallet.js
const express = require("express");
const router = express.Router();
const {verifyToken,adminAuth} = require('../../../middlewares/authentication')

const {
  getAdminWallet,
  createAdminWallet,
  updateAdminWallet
} = require("../handlers/adminWallet");

router.get("/",verifyToken, getAdminWallet);
router.post("/create",verifyToken,adminAuth,createAdminWallet);
router.put("/update",verifyToken,adminAuth, updateAdminWallet);

module.exports = router;