const mongoose = require("mongoose");

const depositTransactionSchema = new mongoose.Schema(
    
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    coin: {
      type: String,
      required: true
    },

    network: {
      type: String,
      required: true
    },

    amount: {
      type: Number,
      required: true
    },

    txHash: {
      type: String,
      default: null // optional proof
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    },

    note: {
      type: String,
      default: ""
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }

  },
  { timestamps: true }
);


module.exports = mongoose.model("transaction", depositTransactionSchema);