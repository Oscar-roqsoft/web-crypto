const axios = require("axios");

const COINGECKO_IDS = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  TRX: "tron",
  SOL: "solana",
  XRP: "ripple",
  XLM: "stellar",
  ADA: "cardano"
};

const getCryptoPrices = async () => {

  const ids = Object.values(COINGECKO_IDS).join(",");

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;

  const { data } = await axios.get(url);

  const priceMap = {};

  for (const coin in COINGECKO_IDS) {
    const id = COINGECKO_IDS[coin];
    priceMap[coin] = data[id]?.usd || 0;
  }

  return priceMap;
};

module.exports = getCryptoPrices;