import { User } from "../models/user.model.js";
import { Account } from "../models/account.model.js";
import secure from "../middleware/authMiddleware.js";
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
      user: userData,
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
      user: user._id,
      status: "ACTIVE"
    });

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