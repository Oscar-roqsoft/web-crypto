const mongoose = require("mongoose");

const BalanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  type: {
    type: String,
    enum: ["deposit", "send", "receive", "swap", "fund"],
    required: true,
  },

  coin: {
    type: String,
    required: true,
    enum: ["BTC", "ETH", "USDT", "TRX", "SOL", "XRP", "XLM", "ADA"],
  },
//   gasFee: {       // Add gas fee here
//     type: Number,
//     default: 0,
//   },

coin: String,
network: String,

amount: Number,

fromCoin: String,
toCoin: String,
receivedAmount: Number,

address: String,

status: {
  type: String,
  enum: ["pending", "completed", "failed"],
  default: "pending",
},

note: String,

  network: {
    type: String,
    required: true,
  },
  balance: {
    type: Number,
    default: 0,
  },
  // optional: track total received/sent
  totalReceived: {
    type: Number,
    default: 0,
  },

  totalSent: {
    type: Number,
    default: 0,
  },

}, { timestamps: true });

module.exports = mongoose.model("Balance", BalanceSchema);





