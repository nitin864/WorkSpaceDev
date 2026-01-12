

//create task 

import { err } from "inngest/types";
import prisma from "../configs/prisma.js";

export const createTask = async (req, res) => {
    try {
        const { userId } = await req.auth()

        const { projectId, title, description, type, status, priority, assigneeId, due_date } = req.body;

        const origin = req.get('origin')

        //check if user has admin role for project 
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: { include: { user: true } } }
        })

        if (!project) {
            return res.status(404).json({ message: "Project not found" })

        } else if (project.team_lead !== userId) {
            return res.status(403).json({ message: "You don't have admin privilegesfor this project " })
        } else if (assigneeId && !project.members.find((member) => member.user.id === assigneeId)) {
            return res.status(403).json({ message: "Assignee is not a member of the project / workspace " })
        }

        const task = await prisma.task.create({
            data: {
                projectId,
                title,
                description,
                priority,
                assigneeId,
                status,
                due_date: new Date(due_date)
            }
        })

        const taskWithAssignee = await prisma.task.findUnique({
            where: { id: task.id },
            include: { assignee: true }
        })

        res.json({ task: taskWithAssignee, message: "Task created successfully" })


    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.code || error.message });
    }
}


//update task
export const updateTask = async (req, res) => {
    try {
        const { userId } = await req.auth()

        // Find the task first
        const task = await prisma.task.findUnique({
            where: { id: req.params.id }
        })

        if (!task) {
            return res.status(404).json({ message: "Task not found" })
        }

        const { title, description, status, priority, assigneeId, due_date } = req.body;

        // Check if user has admin role for project 
        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            include: { members: { include: { user: true } } }
        })

        if (!project) {
            return res.status(404).json({ message: "Project not found" })
        } else if (project.team_lead !== userId) {
            return res.status(403).json({ message: "You don't have admin privileges for this project" })
        } else if (assigneeId && !project.members.find((member) => member.user.id === assigneeId)) {
            return res.status(403).json({ message: "Assignee is not a member of the project / workspace" })
        }

        // Update the task (not create)
        const updatedTask = await prisma.task.update({
            where: { id: req.params.id },
            data: {
                ...(title && { title }),
                ...(description && { description }),
                ...(priority && { priority }),
                ...(assigneeId !== undefined && { assigneeId }),
                ...(status && { status }),
                ...(due_date && { due_date: new Date(due_date) })
            }
        })

        // Fetch task with assignee
        const taskWithAssignee = await prisma.task.findUnique({
            where: { id: updatedTask.id },
            include: { assignee: true }
        })

        res.json({ task: taskWithAssignee, message: "Task updated successfully" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.code || error.message });
    }
}

//delete task

export const deletetask = async (req, res) => {
    try {
        const { userId } = await req.auth()





        const { title, description, status, priority, assigneeId, due_date } = req.body;

        // Check if user has admin role for project 
        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            include: { members: { include: { user: true } } }
        })

        if (!project) {
            return res.status(404).json({ message: "Project not found" })
        } else if (project.team_lead !== userId) {
            return res.status(403).json({ message: "You don't have admin privileges for this project" })
        } else if (assigneeId && !project.members.find((member) => member.user.id === assigneeId)) {
            return res.status(403).json({ message: "Assignee is not a member of the project / workspace" })
        }

        // Update the task (not create)
        const updatedTask = await prisma.task.update({
            where: { id: req.params.id },
            data: {
                ...(title && { title }),
                ...(description && { description }),
                ...(priority && { priority }),
                ...(assigneeId !== undefined && { assigneeId }),
                ...(status && { status }),
                ...(due_date && { due_date: new Date(due_date) })
            }
        })

        // Fetch task with assignee
        const taskWithAssignee = await prisma.task.findUnique({
            where: { id: updatedTask.id },
            include: { assignee: true }
        })

        res.json({ task: taskWithAssignee, message: "Task updated successfully" })
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: error.code || error.message });
    }
}