const express = require("express");
const router = express.Router();

const {
  createCardRequest,
  getMyCards,
  getAllCards,
  approveCard,fundCard,blockCard,requestAgainCard
} = require("../handlers/card");

const {verifyToken,adminAuth} = require("../../../middlewares/authentication");

// User
router.post("/request", verifyToken, createCardRequest);
router.get("/my", verifyToken, getMyCards);
router.put("/re-request", verifyToken, requestAgainCard);

// Admin
router.get("/all", verifyToken, adminAuth, getAllCards);
router.put("/approve", verifyToken, adminAuth, approveCard);
router.post("/fund", verifyToken, adminAuth, fundCard);

router.put("/block", verifyToken, adminAuth, blockCard);

module.exports = router;