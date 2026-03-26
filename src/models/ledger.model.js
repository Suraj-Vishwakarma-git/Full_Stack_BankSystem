import mongoose from "mongoose";

const ledgerSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Account",
    required: true
  },
  type: {
    type: String,
    enum: ["CREDIT", "DEBIT"],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: "Transaction"
  }
}, { timestamps: true });

export const Ledger = mongoose.model("Ledger", ledgerSchema);