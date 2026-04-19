import { User } from "../models/user.model.js";
import { Account } from "../models/account.model.js";
import {secure} from "../middleware/authMiddleware.js";
import { sendEmail,sendTransactionEmail ,otpMail} from "../utils/sendEmail.js";
import bcrypt, { hash } from "bcrypt";
import { otpModel } from "../models/otpmodel.js";
import jwt from "jsonwebtoken";

const JWT_SECRET="supersecret";

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required"
      });
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ message: "Invalid email" });
    }

    // Check existing user
    const isExists = await User.findOne({ email });
    if (isExists) {
      return res.status(400).json({
        message: "Account already exists"
      });
    }
    
    // Create user (password auto hashed)
    const user = await User.create({
      name,
      email,
      password
    });
    const token=jwt.sign({userId:user._id},JWT_SECRET,{expiresIn:"7d"});
    // Remove password
    const userData = user.toObject();
    delete userData.password;

    return res.status(201).json({
      message: "Signup Successfully",
      userData,
      token
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

export const account = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "Please signup or login first"
      });
    }

    const existingAccount = await Account.findOne({ user: user._id });

    if (existingAccount) {
      return res.status(400).json({
        message: "Account already exists for this user"
      });
    }
    let accNo;
    let exists = true;

    while (exists) {
      accNo = generateAccountNumber();
      const existingAcc = await Account.findOne({ accountNumber: accNo });
      if (!existingAcc) exists = false;
    }

    const newAccount = await Account.create({
      name:user.name,
      user: user._id,
      accountNumber:accNo,
      status: "ACTIVE"
    });

    await sendEmail(user.email, "Welcome to Bank 🚀", user.name);
    return res.status(201).json({
      message: "Account Created Successfully",
      account: {
        name: user.name,
        balance: newAccount.balance,
        status: newAccount.status,
        accountNo:newAccount.accountNumber
      }
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};

export const loginaccount = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email:email });
    if (!user) {
      return res.status(404).json({
        message: "User not found, signup first"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid password"
      });
    }

    const account = await Account.findOne({ user: user._id });
    if (!account) {
      return res.status(404).json({
        message: "Account not found, create account first"
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      user,
      token
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

export const useraccount = async (req, res) => {
  try {
    const user = await User.findById({_id:req.userId});

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const userAccount = await Account.findOne({ user: user._id });

    if (!userAccount) {
      return res.status(404).json({ message: "Create Account first" });
    }

    return res.status(200).json({
      email: user.email,
      userAccount
    });

  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }

    // delete old OTPs
    await otpModel.deleteMany({ email });

    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await otpModel.create({
      user: user._id,
      email,
      otp: hashedOtp,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    await otpMail(user.email, user.name || "User", otp);

    res.json({ message: "OTP sent successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error sending mail" });
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, userOTP } = req.body;

    const record = await otpModel.findOne({ email });

    if (!record) {
      return res.status(400).json({ message: "OTP Expired" });
    }

    // expiry check
    if (record.expiresAt < Date.now()) {
      await otpModel.deleteMany({ email });
      return res.status(400).json({ message: "OTP Expired" });
    }

    const isMatch = await bcrypt.compare(userOTP, record.otp);

    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect OTP" });
    }

    // delete OTP after success
    await otpModel.deleteMany({ email });

    // generate reset token
    const token = jwt.sign({ email }, "RESET_SECRET", {
      expiresIn: "10m",
    });

    res.json({
      message: "OTP Verified",
      resetToken: token,
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Error verifying OTP" });
  }
};

export const changepass = async (req, res) => {
  try {
    const { oldPass, newPass, token } = req.body;

    if (!newPass) {
      return res.status(400).json({ message: "New password required" });
    }

    let user;

    // 🔐 Forgot password (OTP flow)
    if (token) {
      let decoded;

      try {
        decoded = jwt.verify(token, "RESET_SECRET");
      } catch {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      user = await User.findOne({ email: decoded.email });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
    }

    // 🔐 Logged-in user
    else if (oldPass && req.userId) {
      user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isMatch = await bcrypt.compare(oldPass, user.password);

      if (!isMatch) {
        return res.status(400).json({ message: "Old password incorrect" });
      }
    }

    else {
      return res.status(400).json({
        message: "Invalid request (provide oldPass or token)",
      });
    }

    // ✅ IMPORTANT: no manual hashing
    user.password = newPass;

    await user.save(); // pre-save will hash

    res.json({ message: "Password updated successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};


export const secureTransaction = async (req, res) => {
  try {
    const { PIN } = req.body;

    if (!PIN) {
      return res.status(400).json({ message: "PIN is required" });
    }

    const acc = await Account.findOne({ user: req.userId });

    if (!acc) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (!acc.transactionPin) {
      return res.status(400).json({ message: "Create PIN first" });
    }

    const isMatch = await bcrypt.compare(PIN, acc.transactionPin);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid PIN" });
    }

    // ✅ SEND RESPONSE (IMPORTANT)
    return res.status(200).json({ message: "PIN verified" });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const allaccounts=async (req,res)=>{
  try{
    const account=await Account.find().populate("user","name email");
    const result=account.map(acc=>({
      id:acc._id,
      name:acc.user?.name,
      email:acc.user?.email,
      status:acc.status
    }));
    res.json({users:result});
  }catch(e){
    console.log(e);
    res.status(500).json({message:"Server error"});
  }
}
export const searchAccounts = async (req, res) => {
  try {
    const search = req.query.search || "";

    const users = await User.find({
      $or: [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ]
    }).limit(5); // limit for safety

    if (users.length === 0) {
      return res.status(404).json({ message: "No user found" });
    }

    // 🔥 CASE 1: Multiple users
    if (users.length > 1) {
      return res.status(200).json({
        multiple: true,
        message: "Multiple users found, try with email"
      });
    }

    // 🔥 CASE 2: Exactly one user
    const account = await Account.findOne({ user: users[0]._id })
      .populate("user", "name email");

    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }

    return res.json({
      multiple: false,
      user: {
        id: account._id,
        name: account.user?.name,
        email: account.user?.email,
        status: account.status
      }
    });

  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "Server error" });
  }
};

function generateAccountNumber() {
  const prefix = "APEX"; 
  const random = Math.floor(1000000000 + Math.random() * 9000000000);
  return prefix + random;
}

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};