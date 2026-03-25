// controllers/adminWalletController.js
const AdminWallet = require("../models/adminWallet");
const {
  sendBadRequestResponse,
  sendSuccessResponse,
  sendSuccessResponseData,
  sendUnauthenticatedErrorResponse
} = require("../responses");

/* =========================
   GET WALLET
========================= */
const getAdminWallet = async (req, res) => {
  try {
    const wallet = await AdminWallet.findOne({});
    if (!wallet) return sendSuccessResponseData(res, "No wallet found", null);
    
    return sendSuccessResponseData(res, "Wallet fetched successfully", {wallets:wallet});
  } catch (err) {
    console.error(err);
    return sendBadRequestResponse(res, "Server error while fetching wallet");
  }
};

/* =========================
   CREATE WALLET
========================= */
const createAdminWallet = async (req, res) => {
  try {
    const { userId,usdtTrc20 } = req.body;
    if (!usdtTrc20) return sendBadRequestResponse(res, "Wallet address is required");

    const exists = await AdminWallet.findOne({});
    if (exists) return sendBadRequestResponse(res, "Wallet already exists");

    const wallet = await AdminWallet.create({ usdtTrc20 });
    return sendSuccessResponseData(res, "Wallet created successfully", {wallets:wallet});
  } catch (err) {
    console.error(err);
    return sendBadRequestResponse(res, "Server error while creating wallet");
  }
};

/* =========================
   UPDATE WALLET
========================= */
const updateAdminWallet = async (req, res) => {
  try {
    const {userId, usdtTrc20 } = req.body;
    if (!usdtTrc20) return sendBadRequestResponse(res, "Wallet address is required");

    const wallet = await AdminWallet.findOneAndUpdate(
      {},
      { usdtTrc20, updatedAt: Date.now() },
      { new: true, upsert: true }
    );

    return sendSuccessResponseData(res, "Wallet updated successfully",{wallets:wallet});
  } catch (err) {
    console.error(err);
    return sendBadRequestResponse(res, "Server error while updating wallet");
  }
};

module.exports = { getAdminWallet, createAdminWallet, updateAdminWallet };