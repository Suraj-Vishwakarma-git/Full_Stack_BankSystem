import mongoose from "mongoose";
import { Account } from "../models/account.model.js";
import { Ledger } from "../models/ledger.model.js";

export const transaction = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { toAccount, amount } = req.body;

    if (!amount || amount <= 0) {
      throw new Error("Invalid amount");
    }

    session.startTransaction();

    const senderAccount = await Account.findOne({ user: req.userId }).session(session);
    const receiverAccount = await Account.findById(toAccount).session(session);

    if (!senderAccount) throw new Error("Sender account not found");
    if (!receiverAccount) throw new Error("Receiver account not found");

    if (senderAccount._id.toString() === receiverAccount._id.toString()) {
      throw new Error("Cannot transfer to same account");
    }

    // 🔥 Atomic debit
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

    // 🔥 Atomic credit
    await Account.findByIdAndUpdate(
      receiverAccount._id,
      { $inc: { balance: amount } },
      { session }
    );

    // 🔥 Ledger
    await Ledger.insertMany(
      [
        {
          account: senderAccount._id,
          type: "DEBIT",
          amount,
          description: `Sent to ${receiverAccount.name} (Acc: ${receiverAccount._id})`
        },
        {
          account: receiverAccount._id,
          type: "CREDIT",
          amount,
          description: `Received from ${updatedSender.name} (Acc: ${senderAccount._id})`
        }
      ],
      { session }
    );

    await session.commitTransaction();

    return res.json({
      message: "Transaction successful",
      from:senderAccount.name,
      to:receiverAccount.name,
      amount
    });

  } catch (error) {
    await session.abortTransaction();

    return res.status(400).json({
      message: error.message
    });

  } finally {
    session.endSession(); // 🔥 best practice
  }
};

export const fetchBalance=async (req,res)=>{
    const userAccount=await Account.findOne({user:req.userId});
    if(!userAccount){
        return res.json({message:"Account Not found"});
    }
    const { page = 1, limit = 10 } = req.query;
    const transactionHistory=await Ledger.find({account:userAccount._id}).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));
    if(transactionHistory.length===0){
        return res.json({message:"No transaction Yet"});
    };
    res.json({
        message:"Transaction History",
        TotalBalance:userAccount.balance,
        History:transactionHistory
    });
}