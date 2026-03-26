import mongoose from "mongoose";

const accountSchema=new mongoose.Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    balance:{
        type:Number,
        default:0
    },
    currency:{
        type:String,
        default:"INR"
    },
    status:{
        type:"String",
        enum:["ACTIVE","FROZEN","CLOSED"],
        default:"ACTIVE"
    }
},{timestamps:true});

export const Account=mongoose.model("Account",accountSchema);
