const express = require("express");
const router = express.Router();


const {
  getAllDeposits,approveDeposit,rejectDeposit,createDeposit
} = require("../handlers/deposits");

const {verifyToken,adminAuth} = require("../../../middlewares/authentication");


// user
router.post("/create", verifyToken, createDeposit);

// ADMIN
router.patch("/approve/:id", verifyToken,adminAuth, approveDeposit);
router.patch("/reject/:id", verifyToken,adminAuth, rejectDeposit);

router.get("/", verifyToken, getAllDeposits);

module.exports = router;
