const express = require("express");

const router = express.Router();

const {
  createWithdrawal,
  getUserWithdrawals,
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal
} = require("../controllers/withdrawal");

const authenticate =
  require("../middleware/authentication");

const authorize =
  require("../middleware/authorization");

// User

router.post(
  "/",
  authenticate,
  createWithdrawal
);

router.get(
  "/my",
  authenticate,
  getUserWithdrawals
);

// Admin

router.get(
  "/",
  authenticate,
  authorize("admin"),
  getAllWithdrawals
);

router.patch(
  "/approve/:id",
  authenticate,
  authorize("admin"),
  approveWithdrawal
);

router.patch(
  "/reject/:id",
  authenticate,
 authorize("admin"),
  rejectWithdrawal
);

module.exports = router;