import { User } from "../models/user.model.js";
import { Account } from "../models/account.model.js";
import secure from "../middleware/authMiddleware.js";
import { sendEmail,sendTransactionEmail } from "../utils/sendEmail.js";
import bcrypt from "bcrypt";
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

    const newAccount = await Account.create({
      name:user.name,
      user: user._id,
      status: "ACTIVE"
    });

    // await sendEmail(user.email, "Welcome to Bank 🚀", user.name);
    return res.status(201).json({
      message: "Account Created Successfully",
      account: {
        name: user.name,
        balance: newAccount.balance,
        status: newAccount.status
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