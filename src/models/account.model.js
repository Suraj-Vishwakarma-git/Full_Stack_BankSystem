import mongoose from "mongoose";
import bcrypt from "bcrypt";

const accountSchema=new mongoose.Schema({
    name:{
        type:String,
        ref:"User",
        required:true
    },
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
    },
    transactionPin:{
        type:String
    }
},{timestamps:true});

accountSchema.pre("save",async function () {
    if(!this.isModified("transactionPin")) return ;
    this.transactionPin=await bcrypt.hash(this.transactionPin,10);
});

accountSchema.methods.comparePin=function (pin){
    return bcrypt.compare(pin,this.transactionPin);
}

export const Account=mongoose.model("Account",accountSchema);
