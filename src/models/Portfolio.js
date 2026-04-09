import mongoose from "mongoose";

const holdingSchema=new mongoose.Schema({
    asset:{
        type:String,
        enum:["GOLD","SILVER"],
        required:true
    },
    totalQuantity:{
        type:Number,
        default:0,
    },
    avgPrice:{
        type:Number,
        default:0,
    },
    investedAmount:{
        type:Number,
        default:0,
    },
});

const portfolioSchema=new mongoose.Schema({
     userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    userAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },

    holdings: [holdingSchema],
},{timestamps:true});


export const portfolio=mongoose.model("portfolio",portfolioSchema);

