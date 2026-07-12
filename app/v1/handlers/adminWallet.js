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

    const wallets = await AdminWallet.find()
      .sort({ coin: 1 });

    return sendSuccessResponseData(
      res,
      "Wallets fetched successfully",
      {
        wallets
      }
    );

  } catch (err) {

    console.error(err);

    return sendBadRequestResponse(
      res,
      err.message
    );

  }
};

/* =========================
   CREATE WALLET
========================= */
const createAdminWallet = async (req, res) => {
  try {

    const { wallets } = req.body;

    if (!Array.isArray(wallets) || wallets.length === 0) {
      return sendBadRequestResponse(
        res,
        "Wallet list is required."
      );
    }

    const created = [];

    for (const item of wallets) {

      const {
        coin,
        network,
        address
      } = item;

      if (!coin || !network || !address) {
        continue;
      }

      const existing = await AdminWallet.findOne({
        coin,
        network
      });

      if (existing) {
        existing.walletAddress = address;
        await existing.save();
        created.push(existing);
      } else {
        const wallet = await AdminWallet.create({
          coin,
          network,
          walletAddress: address
        });

        created.push(wallet);
      }
    }

    return sendSuccessResponseData(
      res,
      "Wallets saved successfully",
      {
        wallets: created
      }
    );

  } catch (err) {

    console.error(err);

    return sendBadRequestResponse(
      res,
      err.message
    );
  }
};

/* =========================
   UPDATE WALLET
========================= */
const updateAdminWallet = async (req, res) => {
  try {

    const { id } = req.params;

    const {
      walletAddress
    } = req.body;

    if (!walletAddress) {
      return sendBadRequestResponse(
        res,
        "Wallet address is required."
      );
    }

    const wallet = await AdminWallet.findByIdAndUpdate(
      id,
      {
        walletAddress
      },
      {
        new: true
      }
    );

    if (!wallet) {
      return sendBadRequestResponse(
        res,
        "Wallet not found."
      );
    }

    return sendSuccessResponseData(
      res,
      "Wallet updated successfully",
      {
        wallet
      }
    );

  } catch (err) {

    console.error(err);

    return sendBadRequestResponse(
      res,
      err.message
    );

  }
};

module.exports = { getAdminWallet, createAdminWallet, updateAdminWallet };