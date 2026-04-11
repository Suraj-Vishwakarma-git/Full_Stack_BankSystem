import axios from "axios";

let cache = {
  GOLD: 6500,
  SILVER: 80
};

let lastFetch = 0;

const CACHE_DURATION = 10000; // 10 seconds
const USD_TO_INR = 93;

// 🔥 fallback values (never fail)
const FALLBACK = {
  GOLD: 6500,
  SILVER: 80
};

export const getPrice = async (asset) => {
  const now = Date.now();

  // ✅ return fresh cache
  if (now - lastFetch < CACHE_DURATION && cache[asset]) {
    return cache[asset];
  }

  try {
    const [goldRes, silverRes] = await Promise.all([
      axios.get(
        "https://api.coingecko.com/api/v3/simple/price?ids=tether-gold&vs_currencies=usd",
        { timeout: 3000 }
      ),
      axios.get(
        "https://api.coingecko.com/api/v3/simple/price?ids=silver-token&vs_currencies=usd",
        { timeout: 3000 }
      )
    ]);

    const goldUSD = goldRes.data["tether-gold"]?.usd;
    const silverUSD = silverRes.data["silver-token"]?.usd;

    if (!goldUSD || !silverUSD) {
      throw new Error("Invalid API response");
    }

    // ✅ update cache
    cache = {
      GOLD: Number((goldUSD * USD_TO_INR).toFixed(2)),
      SILVER: Number((silverUSD * USD_TO_INR).toFixed(2))
    };

    lastFetch = now;

    return cache[asset] || FALLBACK[asset];

  } catch (err) {
    console.error("API FAILED:", err.message);

    // ✅ always return something
    if (cache[asset]) {
      console.warn("Using cached value:", asset);
      return cache[asset];
    }

    console.warn("Using fallback value:", asset);
    return FALLBACK[asset];
  }
};