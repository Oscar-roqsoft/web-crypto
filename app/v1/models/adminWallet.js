const mongoose = require("mongoose");

const AdminWalletSchema = new mongoose.Schema({
  coin: {
    type: String,
    required: true,
  },

  network: {
    type: String,
    required: true,
  },

  walletAddress: {
    type: String,
    required: true,
  }

}, {
  timestamps: true
});

AdminWalletSchema.index(
  { coin: 1, network: 1 },
  { unique: true }
);

module.exports = mongoose.model("AdminWalletV2", AdminWalletSchema);