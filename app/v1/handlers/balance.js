const Balance = require("../models/balance");
const User = require("../models/user");
const getCryptoPrices = require("../../../utils/getCryptoPrices");


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
  BTC: "BTC",
  ETH: "ERC20",
  USDT: "TRC20",
  TRX: "TRC20",
  SOL: "SOL",
  XRP: "XRP",
  XLM: "XLM",
  ADA: "ADA"
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

    const prices = await getCryptoPrices()


    // Convert DB balances to quick lookup map
    const balanceMap = {};

    balances.forEach((b) => {

      const key = `${b.coin}_${b.network}`;

      balanceMap[key] = b;

    });


    let totalBalanceUSD = 0;


    const formattedBalances = SUPPORTED_COINS.map((coin) => {

      const network = COIN_NETWORKS[coin];

      const key = `${coin}_${network}`;

      const balanceDoc = balanceMap[key];


      const balance = balanceDoc ? balanceDoc.balance : 0;

      const price = prices[coin] || 0;


      const valueUSD = balance * price;

      totalBalanceUSD += valueUSD;


      return {
        coin,
        network,
        balance,
        usdPrice: price,
        valueUSD
      };

    });


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
          userId: recipientUser._id,
          coin,
          network: senderBalance.network,
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
    const prices = await getCryptoPrices();

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


const fundUserWallet = async (req,res)=>{

    try{
  
      const { userId, coin, amount,network } = req.body;
  
      if(!userId || !coin || !amount)
        return sendBadRequestResponse(res, "Missing required fields");
       
      let balance = await Balance.findOne({ userId, coin,network });

  
      if(!balance){
  
        balance = new Balance({
          userId,
          coin,
          balance:0,
          network
        });
  
      }
  
      balance.balance += Number(amount);
  
      await balance.save();

      const mybal = {balance}
  
      
      return sendSuccessResponseData(res, "Wallet funded successfully", {...mybal})
  
    }catch(error){
  
      console.error("Fund wallet error:",error);
  
      sendUnauthenticatedErrorResponse(res, error.message);
    }
  
  };
  





module.exports = {
  getUserBalances,
  calculateGasFee,
  sendCrypto,
  swapCrypto,
  fundUserWallet
};