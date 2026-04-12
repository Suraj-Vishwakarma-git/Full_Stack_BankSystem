// priceEngine.js

// 🔥 BASE PRICE (acts as natural center)
const BASE_PRICE = {
  GOLD: 15382,
  SILVER: 260
};

// 🔥 CURRENT PRICES (live market)
let prices = {
  GOLD: BASE_PRICE.GOLD,
  SILVER: BASE_PRICE.SILVER
};
const history = {
  GOLD: [],
  SILVER: []
};

// 🔥 MARKET STATE (controls movement)
let state = {
  GOLD: {
    trend: 0.01,
    momentum: 0,
    volatility: 5,
    regime: "normal",
    regimeStrength: 0
  },
  SILVER: {
    trend: 0.015,
    momentum: 0,
    volatility: 8,
    regime: "normal",
    regimeStrength: 0
  }
};

// 🔧 helper
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

// 🔥 MARKET MOOD (bull / bear / normal)
function updateRegime(s) {
  if (!s.regimeStrength || s.regimeStrength <= 0) {
    const r = Math.random();

    if (r < 0.33) s.regime = "bull";
    else if (r < 0.66) s.regime = "bear";
    else s.regime = "normal";

    // stays in same mood for some time
    s.regimeStrength = 50 + Math.random() * 100;
  } else {
    s.regimeStrength--;
  }
}

// 🔥 MAIN ENGINE
function updateAsset(asset) {
  let p = prices[asset];
  let s = state[asset];

  updateRegime(s);

  // 🔹 regime bias (direction push)
  if (s.regime === "bull") s.trend += 0.001;
  if (s.regime === "bear") s.trend -= 0.001;

  // 🔹 volatility clustering (realistic)
  const randomShock = Math.random() - 0.5;

  s.volatility =
    0.9 * s.volatility +
    0.1 * Math.abs(randomShock) * (asset === "GOLD" ? 5 : 10);

  // 🔹 momentum (smooth movement)
  s.momentum += randomShock * s.volatility * 0.05;
  s.momentum *= 0.9;
  s.momentum = clamp(s.momentum, -5, 5);

  // 🔹 slow trend drift
  s.trend += (Math.random() - 0.5) * 0.002;
  s.trend = clamp(s.trend, -0.03, 0.03);

  // 🔹 mean reversion (FIXED)
  const mean = BASE_PRICE[asset];
  const reversion = (mean - p) * 0.0003;

  // 🔹 micro noise (small fluctuation)
  const micro = (Math.random() - 0.5) * 0.3;

  // 🔹 shock (rare big movement)
  const shock =
    Math.random() < 0.02
      ? (Math.random() - 0.5) * s.volatility * 8
      : 0;

  // 🔥 FINAL CHANGE
  const change =
    s.trend +
    s.momentum +
    reversion +
    micro +
    shock;

  let newPrice = p + change;

  // 🔥 SAFETY LIMITS
  if (asset === "GOLD") {
    newPrice = clamp(newPrice, BASE_PRICE.GOLD * 0.6, BASE_PRICE.GOLD * 1.4);
  } else {
    newPrice = clamp(newPrice, BASE_PRICE.SILVER * 0.6, BASE_PRICE.SILVER * 1.4);
  }

  prices[asset] = Number(newPrice.toFixed(2));
}

// 🔥 MARKET HEARTBEAT
setInterval(() => {
  updateAsset("GOLD");
  updateAsset("SILVER");
  const time=new Date().toLocaleTimeString([],{
    hour:"2-digit",
    minute:"2-digit",
    second:"2-digit"
  });
  history.GOLD.push({time,price:prices.GOLD});
  history.SILVER.push({time,price:prices.SILVER});

  history.GOLD=history.GOLD.slice(-100);
  history.SILVER=history.SILVER.slice(-100);
}, 1500);

// 🔥 EXPORTS (UNCHANGED)
export const getPrice = (asset) => prices[asset];

export const getHistory = (asset) => history[asset] || [];