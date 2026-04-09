import mongoose from "mongoose";
import Account from "../models/account.model.js";
import { Portfolio } from "../models/Portfolio.js";
import { StockTransaction } from "../models/StockTransaction.js";
import { Ledger } from "../models/ledger.model.js";
import { getPrice } from "../utils/getPrice.js";

export const buyAsset = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const { asset, quantity, PIN } = req.body;
    const userId = req.userId;

    // ✅ Validate input
    if (!asset || !quantity || quantity <= 0) {
      throw new Error("Invalid input");
    }

    if (!PIN || !/^\d{4}$/.test(PIN)) {
      throw new Error("Enter valid 4-digit PIN");
    }

    // ✅ Always get price from backend
    const pricePerUnit = await getPrice(asset);
    const totalAmount = pricePerUnit * quantity;

    // ✅ Fetch account
    const account = await Account.findOne({ user: userId }).session(session);
    if (!account) throw new Error("Bank Account not found");

    if (!account.transactionPin) {
      throw new Error("Set your account PIN first");
    }

    const isValidPin = await account.comparePin(PIN);
    if (!isValidPin) throw new Error("Invalid PIN");

    // ✅ Atomic balance deduction
    const updatedAccount = await Account.findOneAndUpdate(
      {
        _id: account._id,
        balance: { $gte: totalAmount },
      },
      { $inc: { balance: -totalAmount } },
      { new: true, session }
    );

    if (!updatedAccount) {
      throw new Error("Insufficient balance");
    }

    // ✅ Portfolio update
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

    // ✅ Transaction record
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

    // ✅ Ledger entry
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