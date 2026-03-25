const Deposit = require("../models/transaction");
const UserBalance = require("../models/balance"); // your balance model

const {
  sendBadRequestResponse,
  sendSuccessResponse,
  sendSuccessResponseData,
  sendUnauthenticatedErrorResponse
} = require("../responses");


/* =========================
   CREATE DEPOSIT (USER)
========================= */
const createDeposit = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { coin, network, amount, txHash } = req.body;

    if (!coin || !amount || !network)
      return sendBadRequestResponse(res, "Missing fields");

    const deposit = await Deposit.create({
      userId,
      coin,
      network,
      amount,
      txHash
    });

    return sendSuccessResponseData(res, "Deposit submitted", {deposit});

  } catch (err) {
    console.error(err);
    return sendBadRequestResponse(res, err.message);
  }
};


/* =========================
   GET ALL DEPOSITS (ADMIN)
========================= */
const getAllDeposits = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const deposits = await Deposit.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Deposit.countDocuments(filter);

    return sendSuccessResponseData(res, "Deposits fetched", {
      deposits,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });

  } catch (err) {
    console.error(err);
    return sendBadRequestResponse(res, err.message);
  }
};


/* =========================
   APPROVE DEPOSIT (ADMIN)
========================= */
const approveDeposit = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { id } = req.params;

    const deposit = await Deposit.findById(id);

    if (!deposit)
      return sendBadRequestResponse(res, "Deposit not found");

    if (deposit.status !== "pending")
      return sendBadRequestResponse(res, "Already processed");

    // CREDIT USER BALANCE
    await UserBalance.findOneAndUpdate(
      { userId: deposit.userId, coin: deposit.coin },
      {
        $inc: { balance: deposit.amount }
      },
      { upsert: true, new: true }
    );

    deposit.status = "approved";
    deposit.approvedBy = adminId;

    await deposit.save();

    return sendSuccessResponse(res, "Deposit approved");

  } catch (err) {
    console.error(err);
    return sendBadRequestResponse(res, err.message);
  }
};


/* =========================
   REJECT DEPOSIT (ADMIN)
========================= */
const rejectDeposit = async (req, res) => {
  try {
    const { id } = req.params;

    const deposit = await Deposit.findById(id);

    if (!deposit)
      return sendBadRequestResponse(res, "Deposit not found");

    if (deposit.status !== "pending")
      return sendBadRequestResponse(res, "Already processed");

    deposit.status = "rejected";

    await deposit.save();

    return sendSuccessResponse(res, "Deposit rejected");

  } catch (err) {
    console.error(err);
    return sendBadRequestResponse(res, err.message);
  }
};


module.exports = {
  createDeposit,
  getAllDeposits,
  approveDeposit,
  rejectDeposit
};