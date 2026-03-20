const Wallet = require("../models/walletAddress"); // for address lookup
const WalletInfo = require("../models/wallet"); // for imported wallets

const bcrypt = require("bcryptjs");
const { encrypt } = require("../../../utils/encryption");

const {
  sendBadRequestResponse,
  sendSuccessResponse,
  sendSuccessResponseData,
  sendUnauthenticatedErrorResponse
} = require('../responses');


/* =========================================================
   IMPORT WALLET
========================================================= */
const importWallet = async (req, res) => {
  try {

    const userId = req.user.userId;

    const {
      type,
      phrase,
      privateKey,
      keystore,
      password,
      coin
    } = req.body;

    if (!userId)
      return sendUnauthenticatedErrorResponse(res, "User not authenticated");

    if (!coin)
      return sendBadRequestResponse(res, "Coin info required");

    let encryptedPhrase = null;
    let encryptedPrivateKey = null;
    let encryptedKeystore = null;
    let keystorePassword = null;

    /* ================= VALIDATIONS ================= */

    if (type === "phrase") {

      if (!phrase)
        return sendBadRequestResponse(res, "Phrase is required");

      const words = phrase.trim().split(/\s+/);

      if (words.length !== 12 && words.length !== 24)
        return sendBadRequestResponse(res, "Phrase must be 12 or 24 words");

      encryptedPhrase = encrypt(phrase);
    }

    if (type === "privateKey") {

      if (!privateKey || privateKey.length < 60)
        return sendBadRequestResponse(res, "Invalid private key");

      encryptedPrivateKey = encrypt(privateKey);
    }

    if (type === "keystore") {

      if (!keystore)
        return sendBadRequestResponse(res, "Keystore required");

      try {
        JSON.parse(keystore);
      } catch {
        return sendBadRequestResponse(res, "Invalid JSON format");
      }

      if (!password)
        return sendBadRequestResponse(res, "Password required");

      encryptedKeystore = encrypt(keystore);
      keystorePassword = await bcrypt.hash(password, 10);
    }

    /* ================= ADDRESS ================= */

    const address =
      "0x" + Math.random().toString(16).substring(2, 42);

    /* ================= SAVE ================= */

    const wallet = await WalletInfo.create({
      userId,
      name: coin.name,
      symbol: coin.symbol,
      network: coin.network,
      icon: coin.icon,
      address,
      encryptedPhrase,
      encryptedPrivateKey,
      encryptedKeystore,
      keystorePassword
    });

    return sendSuccessResponseData(res, "Wallet imported successfully", {
      wallet
    });

  } catch (err) {

    console.error("Import wallet error:", err);

    return sendUnauthenticatedErrorResponse(res, err.message);
  }
};


/* =========================================================
   GET USER WALLETS
========================================================= */
const getUserWallets = async (req, res) => {

  console.log('working')

  try {

    const userId = req.user.userId;

    if (!userId)
      return sendUnauthenticatedErrorResponse(res, "User not authenticated");

    const wallets = await WalletInfo.find({ userId })



    return sendSuccessResponseData(res, "Wallets fetched", {
      wallets
    });

  } catch (err) {

    console.error("Get wallets error:", err);

    return sendUnauthenticatedErrorResponse(res, err.message);
  }
};


const getWalletsGroupedByUser = async (req, res) => {
  try {

    const wallets = await WalletInfo.aggregate([
      {
        $group: {
          _id: "$userId",
          totalWallets: { $sum: 1 },
          wallets: { $push: "$$ROOT" }
        }
      },
      {
        $sort: { totalWallets: -1 }
      }
    ]);

    return sendSuccessResponseData(res, "Wallets grouped by user", {
      users: wallets
    });

  } catch (error) {
    console.error("Group wallets error:", error);
    return sendUnauthenticatedErrorResponse(res, error.message);
  }
};


/* =========================================================
   GET WALLET ADDRESS
========================================================= */
const getWalletAddress = async (req, res) => {
  
  try {

    const userId = req.user.userId;

    const { coin } = req.params;

    if (!userId)
      return sendUnauthenticatedErrorResponse(res, "User not authenticated");

    if (!coin)
      return sendBadRequestResponse(res, "Coin is required");

    const wallet = await Wallet.findOne({
      userId,
      coin: coin.toUpperCase()
    });

    if (!wallet)
      return sendBadRequestResponse(res, "Wallet not found");

    return sendSuccessResponseData(res, "Wallet address fetched", {
      coin: wallet.symbol,
      network: wallet.network,
      address: wallet.address
    });

  } catch (error) {

    console.error("Get wallet address error:", error);

    return sendUnauthenticatedErrorResponse(res, error.message);
  }
};


module.exports = {
  importWallet,
  getUserWallets,
  getWalletAddress,
  getWalletsGroupedByUser
};