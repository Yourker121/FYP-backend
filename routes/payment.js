const express = require("express");
const Appointment = require("../models/Appointment");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.patch("/:id/pay", protect, async (req, res) => {
  try {
    const { method } = req.body;
    if (!["jazzcash", "easypaisa", "bank"].includes(method)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.patient.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Not authorized" });
    }

    appointment.paymentStatus = "done";
    appointment.paymentMethod = method;
    await appointment.save();

    res.json({
      message: "Payment marked as done successfully",
      appointment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error: " + error.message });
  }
});

module.exports = router;
