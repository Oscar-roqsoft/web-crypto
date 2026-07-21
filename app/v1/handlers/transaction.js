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


    const [
      deposits,
      withdrawals,
      balances
    ] = await Promise.all([

      Transaction.find({ userId }).lean(),

      Withdrawal.find({ userId }).lean(),

      Balance.find({ userId }).lean()

    ]);



    /*
    ============================
    DEPOSITS
    ============================
    */

    const formattedDeposits = deposits.map(d => ({

      _id: d._id,

      type: "deposit",

      coin: d.coin,

      amount: d.amount,

      network: d.network,

      walletAddress: d.walletAddress || null,

      txHash: d.txHash || null,

      reference: d.reference || null,

      status: d.status || "pending",

      note: d.note || "",

      createdAt: d.createdAt

    }));




    /*
    ============================
    WITHDRAWALS
    ============================
    */

    const formattedWithdrawals = withdrawals.map(w => ({

      _id: w._id,

      type: "withdrawal",

      coin: w.coin,

      amount: w.amount,

      network: w.network,

      walletAddress: w.walletAddress,

      fee: w.fee || 0,

      netAmount: w.netAmount || w.amount,

      reference: w.reference || null,

      status: w.status || "pending",

      note: w.note || "",

      createdAt: w.createdAt

    }));





    /*
    ============================
    SEND / SWAP
    ============================
    */

    const formattedBalances = balances.map(b => ({

      _id: b._id,

      type: b.type || "transfer",

      coin: b.coin || b.fromCoin,

      amount: b.amount || b.fromAmount,

      toCoin: b.toCoin || null,

      toAmount: b.toAmount || null,

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
    MERGE
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
      "Transactions fetched",
      {
        transactions,

        deposits: formattedDeposits,

        withdrawals: formattedWithdrawals,

        total: transactions.length
      }
    );



  } catch(error){

    console.log(error);

    return sendUnauthenticatedErrorResponse(
      res,
      error.message
    );

  }

};



module.exports={
  getUserTransactions
};