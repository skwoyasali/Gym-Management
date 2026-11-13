import jwt from "jsonwebtoken";
import Gym from "../models/Gym.js";

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "No token",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (["admin", "member"].includes(decoded.role)) {
      const tenantId = decoded.tenantId || decoded.id;
      const gym = await Gym.findOne({ ownerId: tenantId })
        .select("accountStatus expiresAt")
        .lean();
      if (gym?.expiresAt && gym.expiresAt <= new Date()) {
        if (gym.accountStatus !== "inactive") {
          await Gym.updateOne(
            { _id: gym._id, expiresAt: { $lte: new Date() } },
            { $set: { accountStatus: "inactive" } }
          );
        }
        return res.status(403).json({
          success: false,
          code: "GYM_ACCOUNT_EXPIRED",
          message: "Your gym account has expired. Contact your Super Admin.",
        });
      }
      if (gym?.accountStatus === "inactive") {
        return res.status(403).json({
          success: false,
          code: "GYM_ACCOUNT_INACTIVE",
          message: "Your gym account is inactive. Contact your Super Admin.",
        });
      }
    }

    req.user = decoded;

    next();
  } catch (error) {
    if (error.name !== "JsonWebTokenError" && error.name !== "TokenExpiredError") {
      console.error("Authentication check error:", error);
      return res.status(500).json({ message: "Unable to verify your account" });
    }
    return res.status(401).json({
      message: "Invalid token",
    });
  }
};

export default authMiddleware;