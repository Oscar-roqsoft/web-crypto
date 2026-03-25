const Balance = require("../models/balance");
const Transaction = require("../models/transaction");
const {
    sendBadRequestResponse,
    sendSuccessResponse,
    sendSuccessResponseData,
    sendUnauthenticatedErrorResponse
  } = require("../responses");
  
const getUserTransactions = async (req, res) => {
  try {

    const userId = req.user.userId;

    if (!userId)
      return sendBadRequestResponse(res, "User not authenticated");

    /* =========================
       FETCH DATA
    ========================= */

    const deposits = await Transaction.find({ userId }).lean();

    const transactions = await Balance.find({ userId }).lean();


    /* =========================
       FORMAT DEPOSITS
    ========================= */

    const formattedDeposits = deposits.map(d => ({
      type: "deposit",
      coin: d.coin,
      amount: d.amount,
      network: d.network,
      status: d.status,
      createdAt: d.createdAt
    }));


    /* =========================
       FORMAT SEND + SWAP
    ========================= */

    const formattedTransactions = transactions.map(t => ({
      type: t.type,

      coin: t.coin || t.fromCoin,

      amount: t.amount || t.fromAmount,

      toAmount: t.toAmount || null,

      network: t.network,

      recipientAddress: t.recipientAddress || null,

      gasFee: t.gasFee || null,

      status: t.status,

      createdAt: t.createdAt
    }));


    /* =========================
       MERGE + SORT
    ========================= */

    const allTransactions = [
      ...formattedDeposits,
      ...formattedTransactions
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));


    return sendSuccessResponseData(res, "Transactions fetched", {
      transactions: allTransactions
    });

  } catch (error) {

    console.error("Get transactions error:", error);

    return sendUnauthenticatedErrorResponse(res, error.message);
  }
};


module.exports = {
    getUserTransactions
  };