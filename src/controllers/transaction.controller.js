import mongoose from "mongoose";
import { Account } from "../models/account.model.js";
import { Ledger } from "../models/ledger.model.js";
import { sendTransactionEmail } from "../utils/sendEmail.js";
export const transaction = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { toAccount, amount,PIN } = req.body;

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

    if(!senderAccount.transactionPin){
        throw new Error("First SET Your Account PIN")
    }
    if (senderAccount._id.toString() === receiverAccount._id.toString()) {
      throw new Error("Cannot transfer to same account");
    }
    const isValidPin = await senderAccount.comparePin(PIN);
    if(!isValidPin){
        throw new Error("Invalid PIN");
    }
    const updatedSender = await Account.findOneAndUpdate(
      {
        _id: senderAccount._id,
        balance: { $gte: amount }
      },
      {
        $inc: { balance: -amount }
      },
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

  // sender → DEBIT
sendTransactionEmail(
  senderUser.email,
  senderUser.name,
  amount,
  receiverAccount._id,
  "DEBIT"
);

// receiver → CREDIT
sendTransactionEmail(
  receiverUser.email,
  receiverUser.name,
  amount,
  senderAccount._id,
  "CREDIT"
);

    return res.json({
      message: "Transaction successful",
      from: updatedSender.name,
      to: updatedReceiver.name,
      amount,
      senderBalance: updatedSender.balance,
      receiverBalance: updatedReceiver.balance
    });

  } catch (error) {
    await session.abortTransaction();

    return res.status(400).json({
      message: error.message
    });

  } finally {
    session.endSession();
  }
};

export const fetchBalance = async (req, res) => {
  try {
    const { PIN } = req.body;

    if (!PIN || !/^\d{4}$/.test(PIN)) {
      return res.status(400).json({ message: "Enter valid 4-digit PIN" });
    }

    const { page = 1, limit = 10 } = req.query;

    const userAccount = await Account.findOne({ user: req.userId });

    if (!userAccount) {
      return res.status(404).json({ message: "Account not found" });
    }

    // 🔴 NEW CONDITION: Check if PIN is set or not
    if (!userAccount.transactionPin) {
      return res.status(400).json({
        message: "PIN not set. Please create your PIN first."
      });
    }

    const isValidPin = await userAccount.comparePin(PIN);

    if (!isValidPin) {
      return res.status(401).json({ message: "Invalid PIN" });
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