import prisma from "../configs/prisma.js";

// GET user workspaces
export const getUserWorkSpace = async (req, res) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        projects: {
          include: {
            tasks: true,
          },
        },
        members: true,
      },
    });

    return res.status(200).json({ workspaces });
  } catch (error) {
    console.error("getUserWorkSpace error:", error);
    return res.status(500).json({ message: error.message });
  }
};
