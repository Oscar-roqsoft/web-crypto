const mongoose = require("mongoose");

const WithdrawalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    coin: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },

    network: {
      type: String,
      required: true,
      trim: true
    },

    walletAddress: {
      type: String,
      required: true,
      trim: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    fee: {
      type: Number,
      default: 0
    },

    netAmount: {
      type: Number,
      default: 0
    },

    usdValue: {
      type: String,
      default: ""
    },

    txHash: {
      type: String,
      default: ""
    },

    reference: {
      type: String,
      unique: true,
      required: true
    },

    status: {
      type: String,
      enum: [
        "pending",
        "approved",
        "rejected"
      ],
      default: "pending"
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    approvedAt: {
      type: Date,
      default: null
    },

    rejectionReason: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Withdrawal",
  WithdrawalSchema
);