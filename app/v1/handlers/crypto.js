const axios = require("axios");

const {
    sendBadRequestResponse,
    sendSuccessResponse,
    sendSuccessResponseData,
    sendUnauthenticatedErrorResponse
} = require('../responses');



let cache = null;
let lastFetch = 0;

const getCryptoPrices = async (req, res) => {
  try {
    // 🔥 Return cached data (1 minute)
    const CACHE_TIME = 5 * 60 * 1000; // 5 minutes

    if (cache && Date.now() - lastFetch < CACHE_TIME) {
        return res.json({
            success: true,
            data: cache
        });
    }

    const response = await axios.get(
      "https://api.coingecko.com/api/v3/coins/markets",
      {
        params: {
          vs_currency: "usd",
          ids: "bitcoin,ethereum,tether,tron,solana,ripple,stellar,cardano",
          order: "market_cap_desc",
          per_page: 10,
          page: 1,
          sparkline: false,
          price_change_percentage: "24h"
        },
        timeout: 40000,
        headers: {
          "x-cg-demo-api-key": process.env.COINGECKO_API_KEY
        }
      }
    );
// CG-MZ74Hz2PqmgEjPPbvYa4Yd7j
    const networkMap = {
      USDT: "Trc20",
      BTC: "Bitcoin",
      ETH: "Ethereum",
      TRX: "Tron",
      SOL: "Solana",
      XRP: "Ripple",
      XLM: "Stellar",
      ADA: "Cardano"
    };

    const coins = response.data.map((coin) => ({
      name: coin.name,
      symbol: coin.symbol.toUpperCase(),
      price: coin.current_price,
      change24h: coin.price_change_percentage_24h,
      image: coin.image,
      network: networkMap[coin.symbol.toUpperCase()] || null
    }));

    // 💾 Save cache
    cache = coins;
    lastFetch = Date.now();

    return res.json({
      success: true,
      data: coins
    });

  } catch (error) {
    console.error("CoinGecko Error:", error.response?.status, error.message);
    console.error({
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      stack: error.stack
    });

    // 🛟 fallback to cache if available
    if (cache) {
      return res.json({
        success: true,
        data: cache
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch crypto prices"
    });
  }
};

module.exports = { getCryptoPrices };