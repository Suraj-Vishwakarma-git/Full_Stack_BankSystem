import express from "express";
import accountRouter from "./routes/auth.routes.js";
import userTransaction from "./routes/transaction.routes.js";
import cors from "cors";
const app=express();
app.use(express.json());
app.use(cors());
app.use("/api/auth",accountRouter);
app.use("/api/account",userTransaction);

export default app;