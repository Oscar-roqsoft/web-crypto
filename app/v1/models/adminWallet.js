// models/AdminWallet.js
const mongoose = require("mongoose");

const AdminWalletSchema = new mongoose.Schema({
  usdtTrc20: {
    type: String,
    required: true,
    unique: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})


module.exports =  mongoose.model("AdminWallet", AdminWalletSchema);