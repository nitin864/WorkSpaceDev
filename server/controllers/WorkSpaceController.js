import prisma from "../configs/prisma.js";

export const getUserWorkSpace = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: { some: { userId } },
      },
      include: {
        projects: {
          include: { tasks: true },
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

export const addMember = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { email, role, workspaceId, message } = req.body;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!email || !role || !workspaceId) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { members: true },
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const isAdmin = workspace.members.some(
      (m) => m.userId === userId && m.role === "ADMIN"
    );

    if (!isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    const member = await prisma.workspaceMember.create({
      data: { userId: user.id, workspaceId, role, message },
    });

    return res.status(201).json({ member });
  } catch (error) {
    console.error("addMember error:", error);
    return res.status(500).json({ message: error.message });
  }
};
