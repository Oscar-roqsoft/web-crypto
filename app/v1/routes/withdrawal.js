const express = require("express");

const router = express.Router();

const {
  createWithdrawal,
  getUserWithdrawals,
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal
} = require("../handlers/withdrawal");

const {
  verifyToken,
  adminAuth
} = require("../../../middlewares/authentication");

/* ====================================
   USER ROUTES
==================================== */

// Submit withdrawal request
router.post(
  "/create",
  verifyToken,
  createWithdrawal
);

// Logged-in user withdrawal history
router.get(
  "/my",
  verifyToken,
  getUserWithdrawals
);

/* ====================================
   ADMIN ROUTES
==================================== */

// Get all withdrawal requests
router.get(
  "/all",
  verifyToken,
  adminAuth,
  getAllWithdrawals
);

// Approve withdrawal
router.patch(
  "/approve/:id",
  verifyToken,
  adminAuth,
  approveWithdrawal
);

// Reject withdrawal
router.patch(
  "/reject/:id",
  verifyToken,
  adminAuth,
  rejectWithdrawal
);

module.exports = router;