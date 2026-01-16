import prisma from "../configs/prisma.js";
import { inngest } from "../inngest/index.js";

/* ======================================================
   CREATE TASK
====================================================== */
export const createTask = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const {
      projectId,
      title,
      description,
      status,
      priority,
      assigneeId,
      due_date,
    } = req.body;

    const origin =
  process.env.APP_BASE_URL
  || req.get("origin")
  || "";


    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { members: { include: { user: true } } },
    });

    if (!project)
      return res.status(404).json({ message: "Project not found" });

    if (project.team_lead !== userId)
      return res
        .status(403)
        .json({ message: "Admin privileges required" });

    if (
      assigneeId &&
      !project.members.some((m) => m.user.id === assigneeId)
    ) {
      return res
        .status(403)
        .json({ message: "Assignee not part of project" });
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        description,
        status,
        priority,
        assigneeId,
        due_date: due_date ? new Date(due_date) : null,
      },
      include: { assignee: true },
    });

    // 🔥 Trigger Inngest ONLY if assigned
    if (assigneeId) {
      await inngest.send({
        name: "app/task.assigned",
        data: {
          taskId: task.id,
          origin,
        },
      });
    }

    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   UPDATE TASK
====================================================== */
export const updateTask = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const taskId = req.params.id;

    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!existingTask)
      return res.status(404).json({ message: "Task not found" });

    const project = await prisma.project.findUnique({
      where: { id: existingTask.projectId },
      include: { members: { include: { user: true } } },
    });

    if (project.team_lead !== userId)
      return res
        .status(403)
        .json({ message: "Admin privileges required" });

    const {
      title,
      description,
      status,
      priority,
      assigneeId,
      due_date,
    } = req.body;

    if (
      assigneeId &&
      !project.members.some((m) => m.user.id === assigneeId)
    ) {
      return res
        .status(403)
        .json({ message: "Assignee not part of project" });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title,
        description,
        status,
        priority,
        assigneeId,
        due_date: due_date ? new Date(due_date) : null,
      },
      include: { assignee: true },
    });

    // 🔁 Send email ONLY if assignee changed
    if (
      assigneeId &&
      assigneeId !== existingTask.assigneeId
    ) {
      await inngest.send({
        name: "app/task.assigned",
        data: {
          taskId: updatedTask.id,
          origin:
            req.get("origin") || process.env.FRONTEND_URL,
        },
      });
    }

    res.json({
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   DELETE TASKS (BULK)
====================================================== */
export const deleteTask = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { taskIds } = req.body;

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res
        .status(400)
        .json({ message: "taskIds array required" });
    }

    const tasks = await prisma.task.findMany({
      where: { id: { in: taskIds } },
    });

    if (tasks.length === 0)
      return res.status(404).json({ message: "Tasks not found" });

    const project = await prisma.project.findUnique({
      where: { id: tasks[0].projectId },
    });

    if (!project || project.team_lead !== userId) {
      return res
        .status(403)
        .json({ message: "Admin privileges required" });
    }

    await prisma.task.deleteMany({
      where: { id: { in: taskIds } },
    });

    res.json({ message: "Tasks deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
