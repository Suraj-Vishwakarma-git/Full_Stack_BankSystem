import axios from "axios";

let cache = {
  GOLD: 6500,
  SILVER:80
};

let lastFetch = 0;

export const getPrice = async (asset) => {
  const now = Date.now();

  if (now - lastFetch < 10000 && cache[asset]) {
    return cache[asset];
  }
  try {
    const goldRes = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=tether-gold&vs_currencies=usd"
    );
    const silverRes = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=silver-token&vs_currencies=usd"
    );

    const goldUSD = goldRes.data["tether-gold"]?.usd;
    const silverUSD = silverRes.data["silver-token"]?.usd;

    if (!goldUSD || !silverUSD) {
      throw new Error("Invalid API response");
    }
    const USD_TO_INR = 93; 

    cache = {
      GOLD: Number((goldUSD * USD_TO_INR).toFixed(2)),
      SILVER: Number((silverUSD * USD_TO_INR).toFixed(2))
    };
    lastFetch = now;
    return cache[asset];

  } catch (err) {
    throw new Error("Failed to fetch price from CoinGecko");
  }
};