import mongoose from "mongoose";

const ledgerSchema=new mongoose.Schema({
    fromaccount:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Account",
        required:true
    },
    toaccount:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Account",
        required:true
    },
    amount:{
        type:Number,
        required:true
    },
    type:{
        enum:["CREDIT","DEBIT"],
        required:true
    },
    description:{
        type:"String",
        default:"Paid"
    }
},{timestamps:true});


export const Ledger=mongoose.model("Ledger",ledgerSchema);
