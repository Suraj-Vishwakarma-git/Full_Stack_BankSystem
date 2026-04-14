import mongoose from "mongoose";
import { Account } from "../models/account.model.js";
import { Portfolio } from "../models/Portfolio.js";
import { StockTransaction } from "../models/StockTransaction.js";
import { Ledger } from "../models/ledger.model.js";
import { getPrice, getHistory } from "../services/priceService.js";

// ================= SELL =================
export const sellAsset = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { asset, quantity, PIN } = req.body;
    const userId = req.userId;

    if (!["GOLD", "SILVER"].includes(asset)) {
      throw new Error("Invalid asset type");
    }

    if (!quantity || quantity <= 0) {
      throw new Error("Invalid quantity");
    }

    if (!PIN || !/^\d{4}$/.test(PIN)) {
      throw new Error("Enter valid 4-digit PIN");
    }

    const account = await Account.findOne({ user: userId }).session(session);
    if (!account) throw new Error("Bank Account not found");

    const isValidPin = await account.comparePin(PIN);
    if (!isValidPin) throw new Error("Invalid PIN");

    // ✅ FIX: support both user & userId
    const portfolio = await Portfolio.findOne({
      $or: [{ user: userId }, { userId: userId }],
    }).session(session);

    if (!portfolio) throw new Error("Portfolio not found");

    const holding = portfolio.holdings.find((h) => h.asset === asset);
    if (!holding) throw new Error("Asset holding not found");

    if (holding.totalQuantity < quantity) {
      throw new Error("Insufficient quantity");
    }

    const pricePerUnit = await getPrice(asset);
    const totalAmount = Number((pricePerUnit * quantity).toFixed(2));

    const costBasis = Number((holding.avgPrice * quantity).toFixed(2));
    const profit = Number((totalAmount - costBasis).toFixed(2));

    const newQty = holding.totalQuantity - quantity;

    if (newQty === 0) {
      portfolio.holdings = portfolio.holdings.filter(
        (h) => h.asset !== asset
      );
    } else {
      holding.totalQuantity = newQty;
      holding.investedAmount = Number(
        (holding.investedAmount - costBasis).toFixed(2)
      );
      holding.avgPrice = Number(
        (holding.investedAmount / newQty).toFixed(2)
      );
    }

    await portfolio.save({ session });

    const updatedAccount = await Account.findByIdAndUpdate(
      account._id,
      { $inc: { balance: totalAmount } },
      { returnDocument: "after" }
    );

    await StockTransaction.create(
      [
        {
          userId,
          account: account._id,
          asset,
          type: "SELL",
          pricePerUnit,
          quantity,
          totalAmount,
          profit,
          priceTimestamp: new Date(),
        },
      ],
      { session }
    );

    await Ledger.create(
      [
        {
          account: account._id,
          type: "CREDIT",
          amount: totalAmount,
          description: `Sold ${asset}`,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    res.json({
      success: true,
      message: "Asset sold successfully",
      data: {
        asset,
        quantity,
        pricePerUnit,
        totalAmount,
        profit,
        balance: updatedAccount.balance,
      },
    });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();

    res.status(400).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

// ================= BUY =================
export const buyAsset = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { asset, quantity, PIN } = req.body;
    const userId = req.userId;

    const qty = Number(quantity);
    const pinStr = String(PIN);

    if (!asset || !qty || qty <= 0) {
      throw new Error("Invalid input");
    }

    if (!/^\d{4}$/.test(pinStr)) {
      throw new Error("Enter valid 4-digit PIN");
    }

    const pricePerUnit = await getPrice(asset);
    const totalAmount = Number((pricePerUnit * qty).toFixed(2));

    const account = await Account.findOne({ user: userId }).session(session);
    if (!account) throw new Error("Bank Account not found");

    const isValidPin = await account.comparePin(pinStr);
    if (!isValidPin) throw new Error("Invalid PIN");

    const updatedAccount = await Account.findOneAndUpdate(
      {
        _id: account._id,
        balance: { $gte: totalAmount },
      },
      { $inc: { balance: -totalAmount } },
      { returnDocument: "after" }
    );

    if (!updatedAccount) {
      throw new Error("Insufficient balance");
    }

    // ✅ FIX: support both user & userId
    let portfolio = await Portfolio.findOne({
      userAccount: account._id,
      $or: [{ user: userId }, { userId: userId }],
    }).session(session);

    if (!portfolio) {
     const created = await Portfolio.create(
  [
    {
      userId: userId,     // 🔥 REQUIRED FIX
      user: userId,       // (keep for compatibility)
      userAccount: account._id,
      holdings: [],
    },
  ],
  { session }
);
      portfolio = created[0];
    }

    let holding = portfolio.holdings.find(
      (h) => h.asset.toUpperCase() === asset.toUpperCase()
    );

    if (!holding) {
      portfolio.holdings.push({
        asset,
        totalQuantity: qty,
        avgPrice: pricePerUnit,
        investedAmount: totalAmount,
      });
    } else {
      const newQty = holding.totalQuantity + qty;

      const newAvg =
        (holding.totalQuantity * holding.avgPrice +
          qty * pricePerUnit) /
        newQty;

      holding.totalQuantity = newQty;
      holding.avgPrice = Number(newAvg.toFixed(2));
      holding.investedAmount = Number(
        (holding.investedAmount + totalAmount).toFixed(2)
      );
    }

    await portfolio.save({ session });

    await StockTransaction.create(
      [
        {
          userId,
          account: account._id,
          asset,
          type: "BUY",
          pricePerUnit,
          quantity: qty,
          totalAmount,
        },
      ],
      { session }
    );

    await Ledger.create(
      [
        {
          account: account._id,
          type: "DEBIT",
          amount: totalAmount,
          description: `Invested in ${asset}`,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    res.json({
      success: true,
      message: "Asset purchased successfully",
      totalAmount,
      balance: updatedAccount.balance,
    });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();

    res.status(400).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

// ================= GET PORTFOLIO =================
export const getPortfolio = async (req, res) => {
  try {
    const userId = req.userId;

    const account = await Account.findOne({ user: userId });
    if (!account) throw new Error("Account not found");

    // ✅ FIX: support both user & userId
    const portfolio = await Portfolio.findOne({
      $or: [{ user: userId }, { userId: userId }],
    });

    if (!portfolio) {
      return res.json({
        success: true,
        data: {
          balance: account.balance,
          holdings: [],
          totalCurrentValue: 0,
          totalInvested: 0,
          totalProfitLoss: 0,
        },
      });
    }

    const [goldPrice, silverPrice] = await Promise.all([
      getPrice("GOLD"),
      getPrice("SILVER"),
    ]);

    let totalCurrentValue = 0;
    let totalInvested = 0;

    const holdings = portfolio.holdings.map((h) => {
      const currentPrice =
        h.asset === "GOLD" ? goldPrice : silverPrice;

      const currentValue = Number(
        (h.totalQuantity * currentPrice).toFixed(2)
      );

      const profitLoss = Number(
        (currentValue - h.investedAmount).toFixed(2)
      );

      totalCurrentValue += currentValue;
      totalInvested += h.investedAmount;

      return {
        ...h.toObject(),
        currentPrice,
        currentValue,
        profitLoss,
      };
    });

    const totalProfitLoss = Number(
      (totalCurrentValue - totalInvested).toFixed(2)
    );

    res.json({
      success: true,
      data: {
        balance: account.balance,
        holdings,
        totalCurrentValue,
        totalInvested,
        totalProfitLoss,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


export const getCurrentPrice = async (req, res) => {
  try {
    const { asset, quantity } = req.body;

    if (!asset) {
      return res.status(400).json({ error: "Asset is required" });
    }

    if (quantity === undefined || quantity <= 0) {
      return res.status(400).json({ error: "Invalid quantity" });
    }

    const pricePerUnit = await getPrice(asset);

    if (pricePerUnit === null || pricePerUnit === undefined) {
      throw new Error("Price not available");
    }

    if (typeof pricePerUnit !== "number") {
      throw new Error("Invalid price format from API");
    }

    const totalAmount = pricePerUnit * quantity;

    res.json({
      asset,
      pricePerUnit,
      quantity,
      totalAmount,
      currency: "INR"
    });

  } catch (error) {
    console.error("Error in getCurrentPrice:", error.message);

    res.status(500).json({
      error: "Failed to fetch price",
      details: error.message
    });
  }
};


export const dataForGraph = (req, res) => {
  try {
    const { asset } = req.query;

    if (!asset) {
      return res.status(400).json({ error: "Asset required" });
    }

    const graph = getHistory(asset);

    res.json({
      graph
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch graph" });
  }
};