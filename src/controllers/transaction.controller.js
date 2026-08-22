import mongoose from "mongoose";
import { Account } from "../models/account.model.js";
import { Ledger } from "../models/ledger.model.js";
import { User } from "../models/user.model.js";
import { sendTransactionEmail } from "../utils/sendEmail.js";

export const transaction = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { toAccount, amount, PIN } = req.body;

    if (!PIN || !/^\d{4}$/.test(PIN)) {
      throw new Error("Enter valid 4-digit PIN");
    }

    if (!amount || amount <= 0) {
      throw new Error("Invalid amount");
    }

    session.startTransaction();

    const senderAccount = await Account.findOne({ user: req.userId }).session(session);
    const receiverAccount = await Account.findById(toAccount).session(session);

    if (!senderAccount) throw new Error("Sender account not found");
    if (!receiverAccount) throw new Error("Receiver account not found");

    if (!senderAccount.transactionPin) {
      throw new Error("First SET Your Account PIN");
    }

    if (senderAccount._id.toString() === receiverAccount._id.toString()) {
      throw new Error("Cannot transfer to same account");
    }

    const isValidPin = await senderAccount.comparePin(PIN);
    if (!isValidPin) throw new Error("Invalid PIN");

    // 🔥 SAFE BALANCE UPDATE
    const updatedSender = await Account.findOneAndUpdate(
      {
        _id: senderAccount._id,
        balance: { $gte: amount }
      },
      { $inc: { balance: -amount } },
      { returnDocument: "after", session }
    );

    if (!updatedSender) {
      throw new Error("Insufficient balance");
    }

    const updatedReceiver = await Account.findByIdAndUpdate(
      receiverAccount._id,
      { $inc: { balance: amount } },
      { returnDocument: "after", session }
    );

    await Ledger.insertMany(
      [
        {
          account: updatedSender._id,
          type: "DEBIT",
          amount,
          description: `Sent to ${updatedReceiver.name}`
        },
        {
          account: updatedReceiver._id,
          type: "CREDIT",
          amount,
          description: `Received from ${updatedSender.name}`
        }
      ],
      { session }
    );
    await session.commitTransaction();











// lquiwefpiuqwebf





// wugfii
    const senderUser = await User.findById(senderAccount.user);
    const receiverUser = await User.findById(receiverAccount.user);

    // try {
    //   await sendTransactionEmail(
    //     senderUser.email,
    //     senderUser.name,
    //     amount,
    //     updatedReceiver.name,
    //     "DEBIT"
    //   );

    //   await sendTransactionEmail(
    //     receiverUser.email,
    //     receiverUser.name,
    //     amount,
    //     updatedSender.name,
    //     "CREDIT"
    //   );
    // } catch (err) {
    //   console.error("Email failed:", err);
    //   // ❗ DO NOT THROW
    // }

    return res.json({
      message: "Transaction successful",
      from: updatedSender.name,
      to: updatedReceiver.name,
      amount,
      senderBalance: updatedSender.balance,
      receiverBalance: updatedReceiver.balance
    });

  } catch (error) {

    // ✅ SAFE ABORT
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    return res.status(400).json({
      message: error.message
    });

  } finally {
    session.endSession();
  }
};
export const fetchBalance = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const userAccount = await Account.findOne({ user: req.userId });

    if (!userAccount) {
      return res.status(404).json({ message: "Account not found" });
    }

    const transactionHistory = await Ledger.find({
      account: userAccount._id
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return res.status(200).json({
      message: "Transaction History",
      TotalBalance: userAccount.balance,
      page: Number(page),
      History: transactionHistory
    });

  } catch (error) {
    return res.status(500).json({
      message: "Server error"
    });
  }
};
export const accdata = async (req, res) => {
  try {
    const acc = await Account.findOne({ user: req.userId });

    if (!acc) {
      return res.status(404).json({ message: "Account not found" });
    }

    const result = await Ledger.aggregate([
      { $match: { account: acc._id } }, // ✅ FIXED
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" }
        }
      }
    ]);

    let credit = 0;
    let debit = 0;

    result.forEach(item => {
      if (item._id === "CREDIT") credit = item.total;
      if (item._id === "DEBIT") debit = item.total;
    });

    res.json({
      accountNo: acc.accountNumber,
      balance: acc.balance,
      creditAmt: credit,
      debitAmt: debit
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const AddMoney = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    let { amount } = req.body;

    // 🔹 BASIC VALIDATION
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      throw new Error("Enter a valid amount");
    }

    // (optional but good UX limit)
    const MAX_LIMIT = 100000;

    if (numericAmount > MAX_LIMIT) {
      throw new Error(`Max allowed is ₹${MAX_LIMIT}`);
    }

    // 🔹 START TRANSACTION
    session.startTransaction();

    // 🔹 UPDATE BALANCE (clean + direct)
    const updatedAccount = await Account.findOneAndUpdate(
      { user: req.userId },
      { $inc: { balance: numericAmount } },
      { new: true, session }
    );

    if (!updatedAccount) {
      throw new Error("Account not found");
    }

    // 🔹 LEDGER ENTRY
    await Ledger.create(
      [
        {
          account: updatedAccount._id,
          type: "CREDIT",
          amount: numericAmount,
          description: "ApexTrust"
        }
      ],
      { session }
    );

    // 🔹 COMMIT
    await session.commitTransaction();

    // 🔹 RESPONSE
    return res.status(200).json({
      success: true,
      message: "Money added successfully",
      amount: numericAmount,
      balance: updatedAccount.balance
    });

  } catch (error) {

    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    return res.status(400).json({
      success: false,
      message: error.message
    });

  } finally {
    session.endSession();
  }
};