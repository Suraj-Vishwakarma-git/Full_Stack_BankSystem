import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        match:[ /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid Email address" ],
        lowercase:true,
        trim:true,
        unique:true
    },
    password:{
        type:String,
        minlength:[6,"Password is required"],
        required: [true, "Password is required"]
    }
},{timestamps:true});

userSchema.pre("save",async function (){
    if(!this.isModified("password")) return next();
    this.password=await bcrypt.hash(this.password,10);
})

userSchema.methods.comparePassword=async function (password){
    return await bcrypt.compare(password,this.password);
}

export const User=mongoose.model("User",userSchema);