import express from "express";
import { buyAsset,getPortfolio ,sellAsset,getCurrentPrice} from "../controllers/StockController.js";
import { secure } from "../middleware/authMiddleware.js";
const stock=express.Router();
stock.get("/",(req,res)=>{
   res.json({message:"Stock started"})
})
stock.post("/currentprice",getCurrentPrice);
stock.post("/buyasset",secure,buyAsset);
stock.post("/getPortfolio",secure,getPortfolio);
stock.post("/sellasset",secure,sellAsset);

export default stock;