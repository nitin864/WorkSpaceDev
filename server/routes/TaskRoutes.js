import express from "express"; 
import { createTask, deletetask, updateTask } from "../controllers/taskController.js";

const taskRouter = express.Router();

taskRouter.post('/', createTask )
taskRouter.put('/:id', updateTask )
taskRouter.post('/', deletetask )


export default taskRouter;