import { User } from "../models/user.model.js";
import { Account } from "../models/account.model.js";
import { allaccounts, loginaccount, signup,useraccount,searchAccounts ,secureTransaction,changepass, sendOtp, verifyOTP} from "../controllers/auth.controller.js";
import { account } from "../controllers/auth.controller.js";
import {secure} from "../middleware/authMiddleware.js";
import express from "express";

const accountRouter=express.Router();

accountRouter.get("/",(req,res)=>{res.json({message:"UserRouter"})});
accountRouter.post("/signup",signup);
accountRouter.post("/login",loginaccount);
accountRouter.post("/changepass",changepass);
accountRouter.post("/sendotp",sendOtp);
accountRouter.post("/verifyotp",verifyOTP);
accountRouter.post("/securetransaction",secure,secureTransaction)
accountRouter.get("/searchaccount",searchAccounts);
accountRouter.post("/accdetails",secure,useraccount);
accountRouter.get("/allaccounts",allaccounts);
accountRouter.post("/createaccount",secure,account);

export default accountRouter;
