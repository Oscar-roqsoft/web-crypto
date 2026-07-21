const Transaction = require("../models/transaction");
const Balance = require("../models/balance");
const Withdrawal = require("../models/withdrawal");

const {
  sendBadRequestResponse,
  sendSuccessResponseData,
  sendUnauthenticatedErrorResponse
} = require("../responses");

const getUserTransactions = async (req, res) => {

  try {

    const userId = req.user.userId;

    if (!userId) {
      return sendBadRequestResponse(
        res,
        "User not authenticated"
      );
    }

    /* =========================
       FETCH DATA
    ========================= */

    const deposits = await Transaction
      .find({ userId })
      .lean();

    const balances = await Balance
      .find({ userId })
      .lean();

    const withdrawals = await Withdrawal
      .find({ userId })
      .lean();

    /* =========================
       FORMAT DEPOSITS
    ========================= */

    const formattedDeposits = deposits.map(d => ({

      _id: d._id,

      type: "deposit",

      coin: d.coin,

      amount: d.amount,

      network: d.network,

      status: d.status || "pending",

      reference: d.reference || null,

      txHash: d.txHash || null,

      createdAt: d.createdAt

    }));

    /* =========================
       FORMAT WITHDRAWALS
    ========================= */

    const formattedWithdrawals = withdrawals.map(w => ({

      _id: w._id,

      type: "withdrawal",

      coin: w.coin,

      amount: w.amount,

      network: w.network,

      walletAddress: w.walletAddress,

      fee: w.fee || 0,

      netAmount: w.netAmount || w.amount,

      reference: w.reference,

      status: w.status || "pending",

      createdAt: w.createdAt

    }));

    /* =========================
       FORMAT SEND / SWAP
    ========================= */

    const formattedBalances = balances.map(t => ({

      _id: t._id,

      type: t.type,

      coin: t.coin || t.fromCoin,

      amount: t.amount || t.fromAmount,

      toCoin: t.toCoin || null,

      toAmount: t.toAmount || null,

      network: t.network || null,

      recipientAddress:
        t.recipientAddress || null,

      gasFee:
        t.gasFee || 0,

      reference:
        t.reference || null,

      status:
        t.status || "completed",

      createdAt:
        t.createdAt

    }));

    /* =========================
       MERGE + SORT
    ========================= */

    const allTransactions = [

      
      ...formattedWithdrawals,
      ...formattedDeposits,


      ...formattedBalances

    ].sort(

      (a, b) =>
        new Date(b.createdAt) -
        new Date(a.createdAt)

    );

    return sendSuccessResponseData(
      res,
      "Transactions fetched",
      {
        transactions: allTransactions,
        total: allTransactions.length
      }
    );

  } catch (error) {

    console.error(
      "Get transactions error:",
      error
    );

    return sendUnauthenticatedErrorResponse(
      res,
      error.message
    );

  }

};

const getUserAdminTransactions = async (req, res) => {

  try {


    /*
    ============================
    FETCH ALL DATA
    ============================
    */


    const [
      deposits,
      withdrawals,
      balances

    ] = await Promise.all([


      Transaction
      .find()
      .populate(
        "userId",
        "name email"
      )
      .lean(),



      Withdrawal
      .find()
      .populate(
        "userId",
        "name email"
      )
      .lean(),



      Balance
      .find()
      .populate(
        "userId",
        "name email"
      )
      .lean()


    ]);





    /*
    ============================
    DEPOSITS
    ============================
    */


    const formattedDeposits = deposits.map(d => ({


      _id:d._id,


      type:"deposit",


      userId:d.userId,


      coin:d.coin,


      amount:d.amount,


      network:d.network,


      walletAddress:
      d.walletAddress || null,


      txHash:
      d.txHash || null,


      reference:
      d.reference || null,


      status:
      d.status || "pending",


      note:
      d.note || "",


      createdAt:
      d.createdAt



    }));








    /*
    ============================
    WITHDRAWALS
    ============================
    */


    const formattedWithdrawals =
    withdrawals.map(w=>({


      _id:w._id,


      type:"withdrawal",


      userId:w.userId,


      coin:w.coin,


      amount:w.amount,


      network:w.network,


      walletAddress:
      w.walletAddress,


      fee:
      w.fee || 0,


      netAmount:
      w.netAmount || w.amount,


      reference:
      w.reference || null,


      status:
      w.status || "pending",


      note:
      w.note || "",


      createdAt:
      w.createdAt



    }));








    /*
    ============================
    BALANCE / SEND / SWAP
    ============================
    */


    const formattedBalances =
    balances.map(b=>({



      _id:b._id,


      type:
      b.type || "transfer",


      userId:
      b.userId,


      coin:
      b.coin || b.fromCoin,


      amount:
      b.amount || b.fromAmount,


      toCoin:
      b.toCoin || null,


      toAmount:
      b.toAmount || null,


      recipientAddress:
      b.recipientAddress || null,


      gasFee:
      b.gasFee || 0,


      status:
      b.status || "completed",


      reference:
      b.reference || null,


      note:
      b.note || "",


      createdAt:
      b.createdAt



    }));








    /*
    ============================
    MERGE ALL
    ============================
    */


    const transactions = [


      ...formattedDeposits,


      ...formattedWithdrawals,


      ...formattedBalances


    ].sort(
      (a,b)=>
      new Date(b.createdAt)
      -
      new Date(a.createdAt)
    );








    return sendSuccessResponseData(

      res,

      "Admin transactions fetched",

      {


        transactions,


        total:
        transactions.length


      }

    );





  } catch(error){


    console.error(
      "Admin transaction error:",
      error
    );


    return sendUnauthenticatedErrorResponse(

      res,

      error.message

    );


  }


};

module.exports = {
  getUserTransactions,
  getUserAdminTransactions
};