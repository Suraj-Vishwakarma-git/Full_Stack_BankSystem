import mongoose from "mongoose";

const connectDB=async ()=>{
    try{
        console.log("MongoDB connected");
    }
    catch(e){
        console.log("error" + e);
        process.exit(1);
    }
}

export default connectDB;