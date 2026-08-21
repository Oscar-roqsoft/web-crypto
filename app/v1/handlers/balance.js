const Balance = require("../models/balance");
const User = require("../models/user");
const {fetchAllCryptoPrices} = require("../../../utils/cryptoPrices");
const Transaction = require("../models/transaction");

const {
  sendSuccessResponse,
  sendSuccessResponseData,
  sendBadRequestResponse,
  sendUnauthenticatedErrorResponse
} = require("../responses");

const bcrypt = require("bcryptjs");

// Gas fees
const GAS_FEES = {
  BTC: 0.0005,
  ETH: 0.005,
  USDT: 1,
  TRX: 1,
  SOL: 0.01,
  XRP: 0.1,
  XLM: 0.1,
  ADA: 0.1
};




const SUPPORTED_COINS = ["BTC","ETH","USDT","TRX","SOL","XRP","XLM","ADA"];


const COIN_NETWORKS = {
  BTC: "BITCOIN",
  ETH: "ETHEREUM",
  USDT: "TRC20",
  TRX: "TRON",
  SOL: "SOLANA",
  XRP: "RIPPLE",
  XLM: "STELLAR",
  ADA: "CARDONA"
};


/* =========================================================
   GET USER BALANCES
========================================================= */

const getUserBalances = async (req, res) => {
  try {

    const userId = req.user.userId;

    if (!userId)
      return sendBadRequestResponse(res,"User not authenticated");


    const balances = await Balance.find({ userId });

    const prices = await fetchAllCryptoPrices();

    // const prices = {};

    // pricesArray.forEach(item => {
    //     prices[item.symbol] = item.price;
    // });


    // Convert DB balances to quick lookup map
    const balanceMap = {};

    balances.forEach((b) => {

      const key = `${b.coin}_${b.network}`.toUpperCase();

      balanceMap[key] = b;

    });


    let totalBalanceUSD = 0;

    const formattedBalances = SUPPORTED_COINS.map((coin) => {
    
        const network = COIN_NETWORKS[coin];
    
        const key = `${coin}_${network}`.toUpperCase();
    
        const balanceDoc = balanceMap[key];
    
        const balance = Number(balanceDoc?.balance) || 0;
    
        const price = Number(prices?.[coin]) || 0;
    
        const valueUSD = Number((balance * price).toFixed(2));
    
        totalBalanceUSD += valueUSD;
    
        return {
            coin,
            network,
            balance,
            usdPrice: price,
            valueUSD
        };
    
    });
    
    totalBalanceUSD = Number(totalBalanceUSD.toFixed(2));



    return sendSuccessResponseData(res,"Balances fetched",{
      totalBalanceUSD,
      balances: formattedBalances
    });


  } catch (error) {

    console.error("Get balances error:",error);

    sendUnauthenticatedErrorResponse(res,error.message);

  }
};





/* =========================================================
   CALCULATE GAS FEE
========================================================= */

const calculateGasFee = async (req, res) => {
  try {
    const { coin, amount } = req.body;

    if (!coin || !amount)
      return sendBadRequestResponse(res, "Coin and amount required");

    const amt = parseFloat(amount);

    if (amt <= 0)
      return sendBadRequestResponse(res, "Amount must be greater than zero");

    const gasFee = GAS_FEES[coin] || 0;

    const totalCost = amt + gasFee;

    return sendSuccessResponseData(res, "Gas fee calculated", {
      coin,
      amount: amt,
      gasFee,
      totalCost
    });

  } catch (error) {
    console.error("Gas fee error:", error);
    sendUnauthenticatedErrorResponse(res, error.message);
  }
};





/* =========================================================
   SEND CRYPTO
========================================================= */

const sendCrypto = async (req, res) => {
  try {

    const userId = req.user.userId;

    const { pin, coin, amount, recipientAddress } = req.body;

    if (!pin || !coin || !amount || !recipientAddress)
      return sendBadRequestResponse(res, "Missing required fields");



    const amt = parseFloat(amount);

    if (amt <= 0)
      return sendBadRequestResponse(res, "Invalid amount");



    /* Verify PIN */

    const user = await User.findById(userId).select("+pin");

    if (!user)
      return sendBadRequestResponse(res, "User not found");

    const isPinValid = await bcrypt.compare(pin, user.pin);

    if (!isPinValid)
      return sendBadRequestResponse(res, "Incorrect PIN");



    /* Fetch sender balance */

    const senderBalance = await Balance.findOne({ userId, coin });

    if (!senderBalance)
      return sendBadRequestResponse(res, "Balance not found");



    /* Calculate gas */

    const gasFee = GAS_FEES[coin] || 0;

    const totalDeduct = amt + gasFee;



    if (senderBalance.balance < totalDeduct)
      return sendBadRequestResponse(
        res,
        "Insufficient balance including gas fee"
      );



    /* Deduct sender */

    senderBalance.balance -= totalDeduct;
    senderBalance.totalSent += amt;

    await senderBalance.save();



    /* Find recipient (optional system transfer) */

    const recipientUser = await User.findOne({ walletAddress: recipientAddress });



    if (recipientUser) {

      let recipientBalance = await Balance.findOne({
        userId: recipientUser._id,
        coin
      });

      if (!recipientBalance) {
        recipientBalance = await Balance.create({
          userId,
          type: "send",
          coin,
          network: senderBalance.network,
          amount: amt,
          recipientAddress,
          status: "completed",
          balance: 0
        });
      }

      recipientBalance.balance += amt;
      recipientBalance.totalReceived += amt;

      await recipientBalance.save();
    }



    return sendSuccessResponseData(res, "Crypto sent successfully", {
      coin,
      amount: amt,
      gasFee,
      totalDeduct,
      remainingBalance: senderBalance.balance
    });

  } catch (error) {
    console.error("Send crypto error:", error);
    sendUnauthenticatedErrorResponse(res, error.message);
  }
};





/* =========================================================
   SWAP CRYPTO
========================================================= */

const swapCrypto = async (req, res) => {
  try {

    const userId = req.user.userId;

    const { fromCoin, toCoin, fromAmount } = req.body;

    if (!fromCoin || !toCoin || !fromAmount)
      return sendBadRequestResponse(res, "Missing fields");

    const amt = parseFloat(fromAmount);

    if (amt <= 0)
      return sendBadRequestResponse(res, "Invalid amount");


    /* Verify PIN */
    const user = await User.findById(userId).select("+pin");

    // const isPinValid = await bcrypt.compare(pin, user.pin);

    // if (!isPinValid)
    //   return sendBadRequestResponse(res, "Incorrect PIN");


    /* Fetch balances */
    const senderBalance = await Balance.findOne({ userId, coin: fromCoin });

    if (!senderBalance || senderBalance.balance < amt)
      return sendBadRequestResponse(res, "Insufficient balance");


    let receiverBalance = await Balance.findOne({ userId, coin: toCoin });


    /* 🔥 GET LIVE PRICES */
    const prices = await fetchAllCryptoPrices();

    const priceFrom = prices[fromCoin] || 0;
    const priceTo = prices[toCoin] || 0;

    if (!priceFrom || !priceTo)
      return sendBadRequestResponse(res, "Unable to fetch prices");


    /* Calculate conversion */
    const usdValue = amt * priceFrom;

    const toAmount = usdValue / priceTo;


    /* Deduct sender */
    senderBalance.balance -= amt;
    senderBalance.totalSent += amt;

    await senderBalance.save();


    /* Credit receiver */
    if (!receiverBalance) {

      receiverBalance = await Balance.create({
        userId,
        type: "swap",
        fromCoin,
        toCoin,
        fromAmount: amt,
        toAmount,
        status: "completed",
        coin: toCoin,
        network: COIN_NETWORKS[toCoin],
        balance: toAmount
      });

    } else {

      receiverBalance.balance += toAmount;
      receiverBalance.totalReceived += toAmount;

      await receiverBalance.save();
    }


    return sendSuccessResponseData(res, "Swap successful", {
      fromCoin,
      toCoin,
      fromAmount: amt,
      receivedAmount: toAmount,
      rate: `${priceFrom} / ${priceTo}`,
      newFromBalance: senderBalance.balance,
      newToBalance: receiverBalance.balance
    });

  } catch (error) {

    console.error("Swap crypto error:", error);

    sendUnauthenticatedErrorResponse(res, error.message);
  }
};


const fundUserWallet = async (req, res) => {
  try {

    const { userId, coin, amount, network,txHash = null,note = "" } = req.body;

    if (!userId || !coin || !amount || !network) {
      return sendBadRequestResponse(res, "Missing required fields");
    }
    const numericAmount = Number(amount);
    const type = "fund"; // ✅ FORCE TYPE HERE

    let balance = await Balance.findOne({ userId, coin, network });

    if (!balance) {
      balance = new Balance({
        userId,
        coin,
        network,
        balance: 0,
        type,              // ✅ NOW ALWAYS PRESENT
        status: "completed"
      });
    }

    balance.balance += Number(amount);
    balance.totalReceived += Number(amount);

    await balance.save();

    await Transaction.create({

      userId,

      coin,

      network,

      amount: numericAmount,

      txHash,

      status: "approved",

      note,

      type: "fund"

    });


    return sendSuccessResponseData(res, "Wallet funded successfully", {
      balance
    });

  } catch (error) {
    console.error("Fund wallet error:", error);
    sendUnauthenticatedErrorResponse(res, error.message);
  }
};
  
const fundUserWalletManually = async () => {
  try {
    const userId = '6a886d46913eab0046425262';
    const coin = 'USDT';
    const network = 'TRC20';
    const amount = 1134;
    const txHash = null;
    const note = 'wallet funding';

    // January 5, 2026
    const manualDate = new Date('2026-01-05T00:00:00.000Z');

    const numericAmount = Number(amount);

    // Find existing balance
    let balance = await Balance.findOne({
      userId,
      coin,
      network
    });

    if (!balance) {
      balance = new Balance({
        userId,
        coin,
        network,
        balance: 0,
        totalReceived: 0,
        type: 'fund',
        status: 'completed',
        createdAt: manualDate,
        updatedAt: manualDate
      });
    }

    // Add the funding amount
    balance.balance += numericAmount;
    balance.totalReceived += numericAmount;

    // Force the dates
    balance.createdAt = manualDate;
    balance.updatedAt = manualDate;

    await balance.save();

    // Create transaction
    const transaction = await Transaction.create({
      userId,
      coin,
      network,
      amount: numericAmount,
      txHash,
      status: 'approved',
      note,
      type: 'fund',
      createdAt: manualDate,
      updatedAt: manualDate
    });

    console.log('======================================');
    console.log('✅ USER WALLET FUNDED SUCCESSFULLY');
    console.log('======================================');
    console.log('User ID:', userId);
    console.log('Coin:', coin);
    console.log('Network:', network);
    console.log('Amount:', numericAmount);
    console.log('Balance:', balance.balance);
    console.log('Total Received:', balance.totalReceived);
    console.log('Transaction ID:', transaction._id);
    console.log('Transaction Date:', manualDate);
    console.log('======================================');

    return {
      balance,
      transaction
    };

  } catch (error) {
    console.error('❌ Manual funding error:', error);
    throw error;
  }
};

fundUserWalletManually()



module.exports = {
  getUserBalances,
  calculateGasFee,
  sendCrypto,
  swapCrypto,
  fundUserWallet
};