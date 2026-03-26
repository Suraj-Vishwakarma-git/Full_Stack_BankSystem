import { fetchBalance, transaction } from "../controllers/transaction.controller.js";
import express from "express";
import secure from "../middleware/authMiddleware.js";

const userTransaction=express.Router();
userTransaction.post("/transaction",secure,transaction);
userTransaction.get("/fetchbalance",secure,fetchBalance);

export default userTransaction;
