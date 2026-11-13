import Gym from "../models/Gym.js";

export const deactivateExpiredGyms = async () => {
  const result = await Gym.updateMany(
    {
      accountStatus: "active",
      expiresAt: { $ne: null, $lte: new Date() },
    },
    { $set: { accountStatus: "inactive" } }
  );
  return result.modifiedCount;
};

export const startGymExpiryScheduler = () => {
  const run = () => {
    deactivateExpiredGyms().catch((error) =>
      console.error("Gym expiry check failed:", error)
    );
  };
  run();
  const timer = setInterval(run, 60 * 1000);
  timer.unref();
  return timer;
};
