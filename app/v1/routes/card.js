const express = require("express");
const router = express.Router();

const {
  createCardRequest,
  getMyCards,
  getAllCards,
  approveCard,fundCard,blockCard,requestAgainCard,rejectCard
} = require("../handlers/card");

const {verifyToken,adminAuth} = require("../../../middlewares/authentication");

// User
router.post("/request", verifyToken, createCardRequest);
router.get("/my", verifyToken, getMyCards);
router.put("/re-request", verifyToken, requestAgainCard);

// Admin
router.get("/all", verifyToken, adminAuth, getAllCards);
router.put("/approve", verifyToken, adminAuth, approveCard);
router.put("/rejectCard", verifyToken, adminAuth, rejectCard);
router.post("/fund", verifyToken, adminAuth, fundCard);

router.put("/block", verifyToken, adminAuth, blockCard);

module.exports = router;