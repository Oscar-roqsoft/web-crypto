const CardRequest = require("../models/cardRequest");
const bcrypt = require("bcryptjs");
const User = require('../models/user');

const {
  sendSuccessResponse,
  sendSuccessResponseData,
  sendBadRequestResponse,
  sendUnauthenticatedErrorResponse
} = require("../responses");

const Balance = require("../models/balance");



const generateCardNumber = () => {
  return "4" + Math.floor(100000000000000 + Math.random() * 900000000000000);
};

const generateExpiry = () => {
  const year = new Date().getFullYear() + 3;
  return `12/${year.toString().slice(-2)}`;
};

const generateCVV = () => {
  return Math.floor(100 + Math.random() * 900).toString();
};

/* =========================================================
   CREATE CARD REQUEST
========================================================= */

const CARD_FEE_USD = 10;

const createCardRequest = async (req, res) => {
  try {
    const userId = req.user.userId;

    const { cardtype, cardlimit, address, cardpin } = req.body;

    if (!cardtype || !address || !cardpin)
      return sendBadRequestResponse(res, "Missing required fields");

    if (cardpin.length !== 4)
      return sendBadRequestResponse(res, "PIN must be 4 digits");

    /* =========================
       STEP 1: CHECK USDT BALANCE
    ========================= */

    const usdtBalance = await Balance.findOne({
      userId,
      coin: "USDT"
    });
    const user = await User.findOne({
      _id:userId
    });


    if (!usdtBalance)
      return sendBadRequestResponse(res, "USDT wallet not found");

    if (usdtBalance.balance < CARD_FEE_USD)
      return sendBadRequestResponse(
        res,
        "Insufficient USDT balance ($1000 required)"
      );

    /* =========================
       STEP 2: DEDUCT FEE
    ========================= */

    usdtBalance.balance -= CARD_FEE_USD;
    usdtBalance.totalSent += CARD_FEE_USD;

    await usdtBalance.save();

    /* =========================
       STEP 3: CREATE CARD
    ========================= */

    const hashedPin = await bcrypt.hash(cardpin, 10);

    const card = await CardRequest.create({
      userId,
      username:user.name,
      cardType: cardtype,
      cardLimit: cardlimit || 100,
      address,
      cardPin: hashedPin,
      status: "pending"
    });

    return sendSuccessResponseData(res, "Card request successful", {
      card,
      feeCharged: CARD_FEE_USD,
      remainingUSDT: usdtBalance.balance
    });

  } catch (err) {
    console.error(err);
    return sendUnauthenticatedErrorResponse(res, err.message);
  }

};


/* =========================================================
   GET USER CARD REQUESTS
========================================================= */
const getMyCardRequests = async (req, res) => {
  try {
    const userId = req.user.userId;

    const requests = await CardRequest.find({ userId }).sort({ createdAt: -1 });

    return sendSuccessResponseData(res, "Card requests fetched", {
      count: requests.length,
      requests
    });

  } catch (error) {
    console.error("Get card requests error:", error);
    return sendUnauthenticatedErrorResponse(res, error.message);
  }
};


/* =========================================================
   ADMIN: GET ALL REQUESTS
========================================================= */
const getAllCardRequests = async (req, res) => {
  try {
    const requests = await CardRequest.find()
      .populate("userId", "email name")
      .sort({ createdAt: -1 });

    return sendSuccessResponseData(res, "All card requests", {
      count: requests.length,
      requests
    });

  } catch (error) {
    console.error("Admin fetch error:", error);
    return sendUnauthenticatedErrorResponse(res, error.message);
  }
};


const fundCard = async (req, res) => {
    try {
      const { cardId, amount } = req.body;
  
      if (!amount || amount <= 0)
        return sendBadRequestResponse(res, "Invalid amount");
  
      const card = await CardRequest.findById(cardId);
  
      if (!card)
        return sendBadRequestResponse(res, "Card not found");
  
      card.balance += parseFloat(amount);
  
      await card.save();
  
      return sendSuccessResponseData(res, "Card funded", {
        balance: card.balance
      });
  
    } catch (err) {
      console.error(err);
      return sendUnauthenticatedErrorResponse(res, err.message);
    }
  };


/* =========================================================
   ADMIN: UPDATE STATUS
========================================================= */
const approveCard = async (req, res) => {
    try {
      const { cardId } = req.body;
  
      const card = await CardRequest.findById(cardId);
  
      if (!card)
        return sendBadRequestResponse(res, "Card not found");
  
      card.cardNumber = generateCardNumber();
      card.expiry = generateExpiry();
      card.cvv = generateCVV();
  
      card.status = "active";
  
      await card.save();
  
      return sendSuccessResponse(res, "Card approved and activated");
  
    } catch (err) {
      console.error(err);
      return sendUnauthenticatedErrorResponse(res, err.message);
    }
};


const blockCard = async (req, res) => {
    try {
      const { cardId } = req.body;
  
      const card = await CardRequest.findById(cardId);
  
      if (!card)
        return sendBadRequestResponse(res, "Card not found");
  
      card.status = "blocked";
  
      await card.save();
  
      return sendSuccessResponse(res, "Card blocked");
  
    } catch (err) {
      return sendUnauthenticatedErrorResponse(res, err.message);
    }
  };

module.exports = {
  createCardRequest,
  getMyCardRequests,
  getAllCardRequests,
  approveCard,
  blockCard,
  fundCard
};