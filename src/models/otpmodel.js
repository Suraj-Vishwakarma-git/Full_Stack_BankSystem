import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
  user:{
    type:mongoose.Schema.Types.ObjectId,
    required: true
  },
  email: {
    type: String,
    required: true,
  },

  otp: {
    type: String,
    required: true,
  },

  expiresAt: {
    type: Date,
    required: true,
  },

  attempts: {
    type: Number,
    default: 0,
  }

}, { timestamps: true });

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const otpModel=mongoose.model("OTP", otpSchema);