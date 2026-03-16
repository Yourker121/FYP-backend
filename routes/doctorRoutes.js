const express = require("express");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.put("/availability", protect, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { days, startTime, endTime } = req.body;

    const doctor = await User.findById(req.user._id);

    doctor.availability = { days, startTime, endTime };
    await doctor.save();

    res.json({ message: "Availability updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
