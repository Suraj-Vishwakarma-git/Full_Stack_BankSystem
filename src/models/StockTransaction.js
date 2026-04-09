import mongoose from "mongoose";

const stocktransactionSchema=new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    account:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Account",
        required:true
    },
    type: {
      type: String,
      enum: ["BUY", "SELL"],
      required: true,
    },
    asset:{
       type: String,
       enum: ["GOLD", "SILVER"],
       required: true
    },
    pricePerUnit: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED"],
      default: "COMPLETED",
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    quantity:{
        type:Number,
        required:true
    }
},{timestamps:true});

export const StockTransaction=mongoose.model("StockTransaction",stocktransactionSchema);
