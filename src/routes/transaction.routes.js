import { fetchBalance, transaction ,accdata} from "../controllers/transaction.controller.js";
import express from "express";
import {secure} from "../middleware/authMiddleware.js";
import { setPin } from "../controllers/accountPin.js";
import { changePin } from "../controllers/accountPin.js";
const userTransaction=express.Router();
userTransaction.post("/transaction",secure,transaction);
userTransaction.post("/fetchbalance",secure,fetchBalance);
userTransaction.post("/setpin",secure,setPin);
userTransaction.get("/accdata",secure,accdata)
userTransaction.post("/changepin",secure,changePin);
export default userTransaction;
