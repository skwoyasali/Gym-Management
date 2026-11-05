import User from "../models/User.js";

const requireCompletedProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    if (!user.isProfileCompleted) {
      return res.status(403).json({
        message: "Please complete your gym profile first",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
};

export default requireCompletedProfile;