import express from "express";
import {
  createTask,
  deleteTask,
  updateTask,
} from "../controllers/taskController.js";

const taskRouter = express.Router();

taskRouter.post("/", createTask);              // create
taskRouter.put("/:id", updateTask);             // update
taskRouter.delete("/:id", deleteTask);          // delete

export default taskRouter;
