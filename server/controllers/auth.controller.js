import prisma from "../configs/prisma.js";

export const syncUser = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get user details from Clerk (passed via middleware or fetch from Clerk API)
    const { email, name, image } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {
        email,
        name: name || "",
        image: image || "",
      },
      create: {
        id: userId,
        email,
        name: name || "",
        image: image || "",
      },
    });

    res.json({ user });
  } catch (error) {
    console.error("syncUser error:", error);
    res.status(500).json({ message: error.message });
  }
};