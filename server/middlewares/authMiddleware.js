export const protect = (req, res, next) => {
  if (!req.auth || !req.auth.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};
