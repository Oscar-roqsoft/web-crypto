const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  name: String,
  symbol: String,
  network: String,
  icon: String,

  address: String,

  /* ENCRYPTED DATA */
  encryptedPhrase: String,
  encryptedPrivateKey: String,
  encryptedKeystore: String,

  keystorePassword: String, // hashed

}, { timestamps: true });

module.exports = mongoose.model("WalletInfo", walletSchema);