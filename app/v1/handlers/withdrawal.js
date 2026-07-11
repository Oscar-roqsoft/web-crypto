const Withdrawal = require("../models/withdrawal");
const UserBalance = require("../models/balance");
const User = require("../models/user");

const {
  sendBadRequestResponse,
  sendSuccessResponse,
  sendSuccessResponseData
} = require("../responses");

/* =========================
   CREATE WITHDRAWAL
========================= */

const createWithdrawal = async (req, res) => {
  try {
    const userId = req.user.userId;

    const {
      coin,
      network,
      amount,
      walletAddress,
      pin
    } = req.body;

    if (
      !coin ||
      !network ||
      !amount ||
      !walletAddress ||
      !pin
    ) {
      return sendBadRequestResponse(
        res,
        "Missing required fields."
      );
    }

    const user = await User.findById(userId);

    if (!user)
      return sendBadRequestResponse(res, "User not found");

    // Verify PIN
    const isCorrectPin = await user.comparePin(pin);

    if (!isCorrectPin)
      return sendBadRequestResponse(
        res,
        "Invalid transaction PIN."
      );

    const balance = await UserBalance.findOne({
      userId,
      coin
    });

    if (!balance)
      return sendBadRequestResponse(
        res,
        "Wallet not found."
      );

    if (balance.balance < amount)
      return sendBadRequestResponse(
        res,
        "Insufficient balance."
      );

    // deduct balance immediately
    balance.balance -= Number(amount);

    await balance.save();
    const reference =
        "WD-" +
        Date.now() +
        "-" +
        Math.floor(Math.random() * 100000);

    const withdrawal = await Withdrawal.create({
        userId,
        coin,
        network,
        walletAddress,
        amount,
        usdValue: amount * balance.usdPrice,
        fee: 0,
        netAmount: amount,
        reference
      });

    return sendSuccessResponseData(
      res,
      "Withdrawal submitted successfully.",
      {
        withdrawal
      }
    );
  } catch (err) {
    console.log(err);

    return sendBadRequestResponse(
      res,
      err.message
    );
  }
};

/* =========================
   USER WITHDRAWALS
========================= */

const getUserWithdrawals = async (req, res) => {
  try {
    const withdrawals =
      await Withdrawal.find({
        userId: req.user.userId
      }).sort({
        createdAt: -1
      });

    return sendSuccessResponseData(
      res,
      "Withdrawals fetched",
      withdrawals
    );
  } catch (err) {
    return sendBadRequestResponse(
      res,
      err.message
    );
  }
};

/* =========================
   ADMIN GET ALL
========================= */

const getAllWithdrawals = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status
    } = req.query;

    const filter = {};

    if (status)
      filter.status = status;

    const withdrawals =
      await Withdrawal.find(filter)
        .populate(
          "userId",
          "firstName lastName email"
        )
        .sort({
          createdAt: -1
        })
        .skip((page - 1) * limit)
        .limit(Number(limit));

    const total =
      await Withdrawal.countDocuments(filter);

    return sendSuccessResponseData(
      res,
      "Withdrawals fetched",
      {
        withdrawals,
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    );
  } catch (err) {
    return sendBadRequestResponse(
      res,
      err.message
    );
  }
};

/* =========================
   ADMIN APPROVE
========================= */

const approveWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;

    const withdrawal =
      await Withdrawal.findById(id);

    if (!withdrawal)
      return sendBadRequestResponse(
        res,
        "Withdrawal not found."
      );

    if (withdrawal.status !== "pending")
      return sendBadRequestResponse(
        res,
        "Already processed."
      );

      withdrawal.status = "approved";
      withdrawal.approvedBy = req.user.userId;
      withdrawal.approvedAt = new Date();
      withdrawal.txHash = txHash; // from your wallet provider or entered by admin
      
      await withdrawal.save();

    return sendSuccessResponse(
      res,
      "Withdrawal approved."
    );
  } catch (err) {
    return sendBadRequestResponse(
      res,
      err.message
    );
  }
};

/* =========================
   ADMIN REJECT
========================= */

const rejectWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;

    const withdrawal =
      await Withdrawal.findById(id);

    if (!withdrawal)
      return sendBadRequestResponse(
        res,
        "Withdrawal not found."
      );

    if (withdrawal.status !== "pending")
      return sendBadRequestResponse(
        res,
        "Already processed."
      );

    // refund user

    const balance =
      await UserBalance.findOne({
        userId: withdrawal.userId,
        coin: withdrawal.coin
      });

    if (balance) {
      balance.balance +=
        withdrawal.amount;

      await balance.save();
    }

    withdrawal.status = "rejected";
    withdrawal.rejectionReason = reason || "Rejected by administrator";
    
    await withdrawal.save();
    return sendSuccessResponse(
      res,
      "Withdrawal rejected."
    );
  } catch (err) {
    return sendBadRequestResponse(
      res,
      err.message
    );
  }
};

module.exports = {
  createWithdrawal,
  getUserWithdrawals,
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal
};