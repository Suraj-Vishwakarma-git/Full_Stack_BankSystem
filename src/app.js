import express from "express";
import accountRouter from "./routes/auth.routes.js";
import userTransaction from "./routes/transaction.routes.js";
const app=express();
app.use(express.json());
app.use("/api/auth",accountRouter);
app.use("/api/account",userTransaction);
export default app;