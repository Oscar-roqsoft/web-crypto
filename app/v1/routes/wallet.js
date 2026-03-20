const express = require("express");
const router = express.Router();

const { getWalletAddress,importWallet,getUserWallets } = require("../handlers/wallet");

const {verifyToken} = require("../../../middlewares/authentication");

router.get("/:coin", verifyToken, getWalletAddress);

router.post("/import", verifyToken, importWallet);

router.get("/",  verifyToken,getUserWallets);

module.exports = router;