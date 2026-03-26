import mongoose from "mongoose";

const connectDB=async ()=>{
    try{
        mongoose.connect("mongodb://127.0.0.1:27017/MyBankSecure");
        console.log("MongoDB connected");
    }
    catch(e){
        console.log("error" + e);
        process.exit(1);
    }
}

export default connectDB;