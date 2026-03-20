const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  coin: {
    type: String,
    required: true,
    enum: ["BTC","ETH","USDT","TRX","SOL","XRP","XLM","ADA"]
  },

  network: {
    type: String,
    required: true
  },

  address: {
    type: String,
    required: true,
    unique: true
  }

}, { timestamps: true });

module.exports = mongoose.model("Wallet", WalletSchema);