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

// 🔥 cache variables
let cache = null;
let lastFetch = 0;

const getCryptoPrices = async () => {
  try {
    // ⏱️ return cached data (1 min)
    if (cache && Date.now() - lastFetch < 60000) {
      return cache;
    }

    const ids = Object.values(COINGECKO_IDS).join(",");

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;

    const { data } = await axios.get(url, {
      timeout: 10000, // ⏱️ prevent hanging
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/json",
      },
    });

    const priceMap = {};

    for (const coin in COINGECKO_IDS) {
      const id = COINGECKO_IDS[coin];
      priceMap[coin] = data[id]?.usd || 0;
    }

    // 💾 save cache
    cache = priceMap;
    lastFetch = Date.now();

    return priceMap;

  } catch (err) {
    console.error("CoinGecko Error:", err.response?.status, err.message);

    // 🛟 fallback to last cache if available
    if (cache) return cache;

    return {};
  }
};

module.exports = getCryptoPrices;