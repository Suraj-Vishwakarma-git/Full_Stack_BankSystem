import mongoose from "mongoose";
import { Account } from "../models/account.model.js";
import { Portfolio } from "../models/Portfolio.js";
import { StockTransaction } from "../models/StockTransaction.js";
import { Ledger } from "../models/ledger.model.js";
import { getPrice,getHistory } from "../services/priceService.js";


export const sellAsset = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { asset, quantity, PIN } = req.body;
    const userId = req.userId;

    // ✅ VALIDATION
    if (!["GOLD", "SILVER"].includes(asset)) {
      throw new Error("Invalid asset type");
    }

    if (!quantity || quantity <= 0) {
      throw new Error("Invalid quantity");
    }

    if (!PIN || !/^\d{4}$/.test(PIN)) {
      throw new Error("Enter valid 4-digit PIN");
    }

    // ✅ ACCOUNT CHECK
    const account = await Account.findOne({ user: userId }).session(session);
    if (!account) throw new Error("Bank Account not found");

    if (!account.transactionPin) {
      throw new Error("Set your account PIN first");
    }

    const isValidPin = await account.comparePin(PIN);
    if (!isValidPin) throw new Error("Invalid PIN");

    // ✅ PORTFOLIO
    const portfolio = await Portfolio.findOne({ userId }).session(session);
    if (!portfolio) throw new Error("Portfolio not found");

    const holding = portfolio.holdings.find(h => h.asset === asset);
    if (!holding) throw new Error("Asset holding not found");

    if (holding.totalQuantity < quantity) {
      throw new Error("Insufficient quantity");
    }

    // ✅ PRICE FETCH
    const pricePerUnit = await getPrice(asset);
    const totalAmount = Number((pricePerUnit * quantity).toFixed(2));

    // ✅ COST BASIS (IMPORTANT)
    const costBasis = Number((holding.avgPrice * quantity).toFixed(2));

    // ✅ PROFIT / LOSS
    const profit = Number((totalAmount - costBasis).toFixed(2));

    // ✅ UPDATE HOLDING
    const newQty = holding.totalQuantity - quantity;

    if (newQty === 0) {
      // remove asset completely
      portfolio.holdings = portfolio.holdings.filter(h => h.asset !== asset);
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

    // ✅ CREDIT MONEY TO BANK
    const updatedAccount = await Account.findByIdAndUpdate(
      account._id,
      { $inc: { balance: totalAmount } },
      { new: true, session }
    );

    // ✅ TRANSACTION LOG
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

    // ✅ LEDGER ENTRY
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

    // ✅ COMMIT
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
    if (session?.inTransaction?.()) {
      await session.abortTransaction();
    }

    res.status(400).json({
      success: false,
      message: error.message,
    });

  } finally {
    session.endSession();
  }
};

export const buyAsset = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { asset, quantity, PIN } = req.body;
    const userId = req.userId;

    if (!asset || !quantity || quantity <= 0) {
      throw new Error("Invalid input");
    }

    if (!PIN || !/^\d{4}$/.test(PIN)) {
      throw new Error("Enter valid 4-digit PIN");
    }

    const pricePerUnit = await getPrice(asset);
    const totalAmount = pricePerUnit * quantity;

    const account = await Account.findOne({ user: userId }).session(session);
    if (!account) throw new Error("Bank Account not found");

    if (!account.transactionPin) {
      throw new Error("Set your account PIN first");
    }

    const isValidPin = await account.comparePin(PIN);
    if (!isValidPin) throw new Error("Invalid PIN");

    const updatedAccount = await Account.findOneAndUpdate(
      {
        _id: account._id,
        balance: { $gte: totalAmount },
      },
      { $inc: { balance: -totalAmount } },
      { new: true, session }
    );

    if (!updatedAccount){
      throw new Error("Insufficient balance");
    }

    let portfolio = await Portfolio.findOne({ userId }).session(session);

    if (!portfolio) {
      portfolio = await Portfolio.create(
        [{ userId, userAccount: account._id, holdings: [] }],
        { session }
      );
      portfolio = portfolio[0];
    }

    let holding = portfolio.holdings.find(h => h.asset === asset);

    if (!holding) {
      portfolio.holdings.push({
        asset,
        totalQuantity: quantity,
        avgPrice: pricePerUnit,
        investedAmount: totalAmount,
      });
    } else {
      const newQty = holding.totalQuantity + quantity;

      const newAvg =
        (holding.totalQuantity * holding.avgPrice +
          quantity * pricePerUnit) /
        newQty;

      holding.totalQuantity = newQty;
      holding.avgPrice = newAvg;
      holding.investedAmount += totalAmount;
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
          quantity,
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
      totalAmount
    });

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    res.status(400).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

export const getPortfolio = async (req, res) => {
  try {
    const { PIN } = req.body;
    const userId = req.userId;

    const account = await Account.findOne({ user: userId });
    if (!account) throw new Error("Account not found");

    const isValidPin = await account.comparePin(PIN);
    if (!isValidPin) throw new Error("Invalid PIN");

    const portfolio = await Portfolio.findOne({ userId });
    if (!portfolio) throw new Error("Portfolio not found");

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