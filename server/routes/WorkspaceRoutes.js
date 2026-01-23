import express from "express";
import {
  addMember,
  getUserWorkSpace,
} from "../controllers/WorkSpaceController.js";

const WorkspaceRouter = express.Router();

WorkspaceRouter.get("/", getUserWorkSpace);
WorkspaceRouter.post("/add-member", addMember);

export default WorkspaceRouter;
