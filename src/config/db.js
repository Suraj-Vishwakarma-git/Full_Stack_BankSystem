import mongoose from "mongoose";

const connectDB=async ()=>{
    try{
       await mongoose.connect("mongodb+srv://ssvsurajvishwakarma_db_user:7058@cluster0.kn1gsi8.mongodb.net/MyBank");
        console.log("MongoDB connected");
    }
    catch(e){
        console.log("error" + e);
        process.exit(1);
    }
}

export default connectDB;