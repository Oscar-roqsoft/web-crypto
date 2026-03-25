const axios = require("axios");

const {
    sendBadRequestResponse,
    sendSuccessResponse,
    sendSuccessResponseData,
    sendUnauthenticatedErrorResponse
} = require('../responses');


const getCryptoPrices = async (req, res) => {
  try {
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
        }
      }
    );

    // Map coin to network manually (you can extend as needed)
    const networkMap = {
      USDT: "Trc20",       // TRC20
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

    res.json({
      success: true,
      data: coins
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch crypto prices"
    });
  }
};






module.exports = { getCryptoPrices };