import mongoose from "mongoose";

const holdingSchema = new mongoose.Schema({
  asset: {
    type: String,
    enum: ["GOLD", "SILVER"],
    required: true,
  },
  totalQuantity: {
    type: Number,
    default: 0,
    min: 0,
  },
  avgPrice: {
    type: Number,
    default: 0,
    min: 0,
  },
  investedAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
});

const portfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },

    userAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },

    holdings: {
      type: [holdingSchema],
      default: [],
    },
  },
  { timestamps: true }
);

portfolioSchema.index({ userId: 1, userAccount: 1 }, { unique: true });

export const Portfolio = mongoose.model("Portfolio", portfolioSchema);