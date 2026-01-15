import express from "express";
import { syncUser } from "../controllers/auth.controller.js";

const AuthRouter = express.Router();

AuthRouter.post("/sync", syncUser);

export default AuthRouter;