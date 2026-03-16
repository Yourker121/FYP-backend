const express = require("express");
const router = express.Router();
const Review = require("../models/Review");
const Appointment = require("../models/Appointment");
const { protect } = require("../middleware/authMiddleware");

router.get("/check/:appointmentId", protect, async (req, res) => {
  try {
    const existing = await Review.findOne({
      appointment: req.params.appointmentId,
    });
    res.json({ reviewed: !!existing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", protect, async (req, res) => {
  const { doctorId, appointmentId, rating } = req.body;
  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment || appointment.status !== "completed") {
      return res
        .status(400)
        .json({ message: "Only completed appointments can be reviewed" });
    }
    const existing = await Review.findOne({ appointment: appointmentId });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Already reviewed this appointment" });
    }
    const review = await Review.create({
      patient: req.user._id,
      doctor: doctorId,
      appointment: appointmentId,
      rating,
    });
    res.status(201).json({ message: "Rating submitted!", review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:doctorId", async (req, res) => {
  try {
    const reviews = await Review.find({ doctor: req.params.doctorId });
    const avg = reviews.length
      ? (
          reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        ).toFixed(1)
      : 0;
    res.json({ average: avg, total: reviews.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
