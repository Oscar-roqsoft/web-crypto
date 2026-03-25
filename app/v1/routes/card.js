const express = require("express");
const router = express.Router();

const {
  createCardRequest,
  getMyCardRequests,
  getAllCardRequests,
  approveCard,fundCard,blockCard
} = require("../handlers/card");

const {verifyToken,adminAuth} = require("../../../middlewares/authentication");

// User
router.post("/request", verifyToken, createCardRequest);
router.get("/my", verifyToken, getMyCardRequests);

// Admin
router.get("/all", verifyToken, adminAuth, getAllCardRequests);
router.put("/approve", verifyToken, adminAuth, approveCard);
router.post("/fund", verifyToken, adminAuth, fundCard);
router.put("/block", verifyToken, adminAuth, blockCard);

module.exports = router;