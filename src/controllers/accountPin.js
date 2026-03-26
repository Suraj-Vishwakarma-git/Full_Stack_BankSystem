import { Account } from "../models/account.model";


export const setPin=async (req,res)=>{
    try{
        const {pin}=req.body;
        if(!pin || !/^\d{4}$/.test(pin)){
            throw new Error("PIN must be exactly 4 digits");
        }
        const account=await Account.findOne({user:req.userId});
        if(!account) return res.json({message:"Invalid Account"});
        if (account.transactionPin) {
           throw new Error("PIN already set. Use change PIN.");
        }
        account.transactionPin=pin;
        await account.save();
        res.json({
            message: "Transaction PIN set successfully"
        });
    }catch(e){
        res.status(400).json({message:e.message});
    }
};

export const changePin=async (req,res)=>{
    try{
        const {oldPin,newPin}=req.body;
        if(!newPin || !/^\d{4}$/.test(newPin)){
            throw new Error("PIN must be exactly 4 digits");
        }
        if (!oldPin) {
          throw new Error("Old PIN is required");
        }
        if (oldPin === newPin) {
        throw new Error("New PIN cannot be same as old PIN");
         }
        const account=await Account.findOne({user:req.userId});
        if(!account) throw new Error("Account not found");
        const isMatch=await account.comparePin(oldPin);
        if(!isMatch){
            throw new Error("Incorrect Old pin");
        }
        account.transactionPin=newPin;
        await account.save();
        res.json({
            message:"PIN changed Successfully"
        });
    }catch(e){
        res.status(400).json({
            message:e.message
        })
    }
}