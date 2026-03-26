import express from "express";
import accountRouter from "./routes/auth.routes.js";
const app=express();
app.use(express.json());
app.use("/api/auth",accountRouter);
export default app;