import { User } from "../models/user.model.js";
import { Account } from "../models/account.model.js";
import { loginaccount, signup,useraccount } from "../controllers/auth.controller.js";
import { account } from "../controllers/auth.controller.js";
import secure from "../middleware/authMiddleware.js";
import express from "express";

const accountRouter=express.Router();

accountRouter.get("/",(req,res)=>{res.json({message:"UserRouter"})});
accountRouter.post("/signup",signup);
accountRouter.post("/login",loginaccount);
accountRouter.post("/accdetails",secure,useraccount);
accountRouter.post("/createaccount",secure,account);

export default accountRouter;
