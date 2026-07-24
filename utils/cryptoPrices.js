// services/cryptoPrices.js

const axios = require("axios");

let cache = null;
let lastFetch = 0;

const CACHE_TIME = 5 * 60 * 1000;

async function fetchAllCryptoPrices() {

    if (cache && Date.now() - lastFetch < CACHE_TIME) {
        return cache;
    }

    const response = await axios.get(
        "https://api.coingecko.com/api/v3/coins/markets",
        {
            params: {
                vs_currency: "usd",
                ids: "bitcoin,ethereum,tether,tron,solana,ripple,stellar,cardano",
                sparkline: false,
                price_change_percentage: "24h",
                x_cg_demo_api_key: process.env.COINGECKO_API_KEY
            }
        }
    );

    const prices = {};

    response.data.forEach((coin) => {

        prices[coin.symbol.toUpperCase()] = Number(coin.current_price);

    });

    cache = prices;

    lastFetch = Date.now();

    return prices;

}

module.exports = {
    fetchAllCryptoPrices
};