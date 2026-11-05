

import Gym from "../models/Gym.js";
import User from "../models/User.js";

export const completeProfile = async (req, res) => {
  try {
    const {
      gymName,
      ownerName,
      phone,
      address,
      city,
      state,
      pincode,
    } = req.body;

    // Validate required fields
    if (
      !gymName ||
      !ownerName ||
      !phone ||
      !address ||
      !city ||
      !state ||
      !pincode
    ) {
      return res.status(400).json({
        message: "Please fill all required fields",
      });
    }

    // Check if user exists
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // Prevent completing profile multiple times
    if (user.isProfileCompleted) {
      return res.status(400).json({
        message: "Profile is already completed",
      });
    }

    // Create gym
    const gym = await Gym.create({
      ownerId: user._id,
      gymName,
      ownerName,
      phone,
      address,
      city,
      state,
      pincode,
    });

    // Mark user profile as completed
    user.isProfileCompleted = true;

    await user.save();

    res.status(201).json({
      message: "Gym profile completed successfully",
      gym,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server error",
    });
  }
};