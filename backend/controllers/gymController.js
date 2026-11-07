

import Gym from "../models/Gym.js";
import User from "../models/User.js";
import {
  deletePrivateImage,
  getPrivateImagePath,
  savePrivateImage,
} from "../utils/privateImageStorage.js";

const getTenantId = (user) => user.tenantId || user.id;

const getPaymentSettings = (gym) => ({
  upiId: gym.upiPayment?.upiId || "",
  receiverName: gym.upiPayment?.receiverName || "",
  paymentNumber: gym.upiPayment?.paymentNumber || "",
  instructions: gym.upiPayment?.instructions || "",
  qrConfigured: Boolean(gym.upiPayment?.qrStorageKey),
  qrUrl: gym.upiPayment?.qrStorageKey ? "/gym/payment-qr" : null,
});

export const getGymPaymentSettings = async (req, res) => {
  try {
    const gym = await Gym.findOne({ ownerId: getTenantId(req.user) })
      .select("+upiPayment.qrStorageKey")
      .lean();
    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Gym profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: getPaymentSettings(gym),
    });
  } catch (error) {
    console.error("Get gym payment settings error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment settings",
    });
  }
};

export const updateGymPaymentSettings = async (req, res) => {
  try {
    const upiId = typeof req.body.upiId === "string" ? req.body.upiId.trim() : "";
    const receiverName =
      typeof req.body.receiverName === "string"
        ? req.body.receiverName.trim()
        : "";
    const paymentNumber =
      typeof req.body.paymentNumber === "string"
        ? req.body.paymentNumber.trim()
        : "";
    const instructions =
      typeof req.body.instructions === "string"
        ? req.body.instructions.trim()
        : "";

    if (
      upiId.length > 120 ||
      (upiId && !/^[\w.-]{2,100}@[A-Za-z0-9.-]{2,50}$/.test(upiId)) ||
      receiverName.length > 120 ||
      paymentNumber.length > 30 ||
      (paymentNumber && !/^\+?[0-9\s()-]{7,30}$/.test(paymentNumber)) ||
      instructions.length > 500
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter valid UPI payment details and instructions",
      });
    }

    const gym = await Gym.findOneAndUpdate(
      { ownerId: getTenantId(req.user) },
      {
        $set: {
          "upiPayment.upiId": upiId,
          "upiPayment.receiverName": receiverName,
          "upiPayment.paymentNumber": paymentNumber,
          "upiPayment.instructions": instructions,
        },
      },
      { new: true, runValidators: true }
    ).select("+upiPayment.qrStorageKey");

    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Gym profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment settings saved",
      data: getPaymentSettings(gym),
    });
  } catch (error) {
    console.error("Update gym payment settings error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save payment settings",
    });
  }
};

export const uploadGymPaymentQr = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Choose a QR code image to upload",
    });
  }

  let savedImage;
  try {
    savedImage = await savePrivateImage(req.file.buffer, req.file.mimetype);
    const gym = await Gym.findOne({ ownerId: getTenantId(req.user) })
      .select("+upiPayment.qrStorageKey");

    if (!gym) {
      await deletePrivateImage(savedImage.storageKey);
      return res.status(404).json({
        success: false,
        message: "Gym profile not found",
      });
    }

    const previousStorageKey = gym.upiPayment?.qrStorageKey;
    gym.set("upiPayment.qrStorageKey", savedImage.storageKey);
    await gym.save();
    if (previousStorageKey) {
      await deletePrivateImage(previousStorageKey).catch((cleanupError) =>
        console.error("Remove previous gym QR error:", cleanupError)
      );
    }

    return res.status(200).json({
      success: true,
      message: "UPI QR code uploaded",
      data: getPaymentSettings(gym),
    });
  } catch (error) {
    if (savedImage) await deletePrivateImage(savedImage.storageKey);
    console.error("Upload gym payment QR error:", error);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to upload UPI QR code",
    });
  }
};

export const deleteGymPaymentQr = async (req, res) => {
  try {
    const gym = await Gym.findOne({ ownerId: getTenantId(req.user) })
      .select("+upiPayment.qrStorageKey");
    if (!gym) {
      return res.status(404).json({
        success: false,
        message: "Gym profile not found",
      });
    }

    const storageKey = gym.upiPayment?.qrStorageKey;
    gym.set("upiPayment.qrStorageKey", undefined);
    await gym.save();
    if (storageKey) {
      await deletePrivateImage(storageKey).catch((cleanupError) =>
        console.error("Remove gym QR error:", cleanupError)
      );
    }

    return res.status(200).json({
      success: true,
      message: "UPI QR code removed",
      data: getPaymentSettings(gym),
    });
  } catch (error) {
    console.error("Delete gym payment QR error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove UPI QR code",
    });
  }
};

export const getGymPaymentQr = async (req, res) => {
  try {
    const gym = await Gym.findOne({ ownerId: getTenantId(req.user) })
      .select("+upiPayment.qrStorageKey")
      .lean();
    const imagePath = getPrivateImagePath(gym?.upiPayment?.qrStorageKey);
    if (!imagePath) {
      return res.status(404).json({
        success: false,
        message: "Gym payment QR code not found",
      });
    }

    return res.sendFile(imagePath, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Get gym payment QR error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve gym payment QR code",
    });
  }
};

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