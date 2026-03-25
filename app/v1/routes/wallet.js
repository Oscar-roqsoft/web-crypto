const express = require("express");
const router = express.Router();

const { getWalletAddress,importWallet,getUserWallets,getWalletsByAdmin } = require("../handlers/wallet");

const {verifyToken,adminAuth} = require("../../../middlewares/authentication");

router.get("/:coin", verifyToken, getWalletAddress);

router.post("/import", verifyToken, importWallet);

router.get("/",  verifyToken,getUserWallets);
router.get("/all/:page/:limit", verifyToken,adminAuth,getWalletsByAdmin);

module.exports = router;