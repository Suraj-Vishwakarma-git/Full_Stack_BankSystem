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
    // ✅ PRIMARY FIELD (USE THIS EVERYWHERE)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ✅ BACKWARD COMPATIBILITY (optional)
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

// ✅ PREVENT DUPLICATE PORTFOLIOS (VERY IMPORTANT)
portfolioSchema.index({ userId: 1, userAccount: 1 }, { unique: true });

export const Portfolio = mongoose.model("Portfolio", portfolioSchema);