// models/card.js
const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User"
    },

    cardType: {
      type: String,
      enum: ["visa", "master", "amex"],
      required: true
    },

    cardNumber: String,
    expiry: String,
    cvv: String,

    cardLimit: {
      type: Number,
      default: 100
    },

    address: String,

    cardPin: String,

    balance: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: ["pending", "approved", "active", "blocked", "rejected"],
      default: "pending"
    }

  },
  { timestamps: true }
);

module.exports = mongoose.model("Card", cardSchema);