const crypto = require("crypto");

const generateWalletAddress = (coin) => {

  switch (coin) {

    case "BTC":
      return "bc1" + crypto.randomBytes(20).toString("hex")

    case "ETH":
      return "0x" + crypto.randomBytes(20).toString("hex")

    case "USDT":
    case "TRX":
      return "T" + crypto.randomBytes(16).toString("hex")

    case "SOL":
      return crypto.randomBytes(32).toString("hex")

    case "XRP":
      return "r" + crypto.randomBytes(16).toString("hex")

    case "XLM":
      return "G" + crypto.randomBytes(28).toString("hex").toUpperCase()

    case "ADA":
      return "addr1" + crypto.randomBytes(20).toString("hex")

    default:
      return crypto.randomBytes(20).toString("hex")

  }

}

module.exports = generateWalletAddress;