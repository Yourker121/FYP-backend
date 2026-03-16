const express = require("express");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const { protect } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

router.post("/", protect, async (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res
        .status(401)
        .json({ message: "Only patients can book appointments" });
    }

    const { doctorId, date, time, reason } = req.body;

    if (!doctorId || !date || !time) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "doctor") {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const selectedDay = new Date(date).toLocaleString("en-US", {
      weekday: "long",
    });

    if (!doctor.availability?.days?.includes(selectedDay)) {
      return res
        .status(400)
        .json({ message: `Doctor not available on ${selectedDay}` });
    }

    if (
      time < doctor.availability.startTime ||
      time > doctor.availability.endTime
    ) {
      return res
        .status(400)
        .json({ message: "Selected time is outside doctor's working hours" });
    }

    const existing = await Appointment.findOne({
      doctor: doctorId,
      date,
      time,
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "This time slot is already booked" });
    }

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      date,
      time,
      reason,
      status: "pending",
      paymentStatus: "unpaid",
    });

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/patient", protect, async (req, res) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(401).json({ message: "Not authorized" });
    }

    const appointments = await Appointment.find({
      patient: req.user._id,
    })
      .populate("doctor", "name email")
      .sort({ createdAt: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/doctor", protect, async (req, res) => {
  try {
    if (req.user.role !== "doctor") {
      return res.status(401).json({ message: "Not authorized" });
    }

    const appointments = await Appointment.find({
      doctor: req.user._id,
    })
      .populate("patient", "name email")
      .sort({ createdAt: -1 });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/status", protect, async (req, res) => {
  try {
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (
      req.user.role !== "admin" &&
      appointment.doctor.toString() !== req.user._id.toString()
    ) {
      return res.status(401).json({ message: "Not authorized" });
    }

    appointment.status = status;
    await appointment.save();

    res.json({
      message: `Appointment ${status} successfully`,
      appointment,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch(
  "/:id/pay",
  protect,
  upload.single("screenshot"),
  async (req, res) => {
    try {
      const { method } = req.body;

      const appointment = await Appointment.findById(req.params.id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      if (appointment.status !== "approved") {
        return res
          .status(400)
          .json({ message: "Appointment not approved yet" });
      }

      if (appointment.patient.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: "Not authorized" });
      }

      appointment.paymentMethod = method;

      if (method === "physical") {
        appointment.paymentStatus = "pending_verification";
      } else {
        if (!req.file) {
          return res
            .status(400)
            .json({ message: "Screenshot required for online payment" });
        }

        appointment.paymentScreenshot = req.file.path;
        appointment.paymentStatus = "pending_verification";
      }

      await appointment.save();

      res.json({
        message: "Payment submitted. Waiting for doctor verification.",
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

router.patch("/:id/verify-payment", protect, async (req, res) => {
  try {
    const { action } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (
      req.user.role !== "doctor" ||
      appointment.doctor.toString() !== req.user._id.toString()
    ) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (appointment.paymentStatus !== "pending_verification") {
      return res
        .status(400)
        .json({ message: "Payment not awaiting verification" });
    }

    if (action === "accept") {
      appointment.paymentStatus = "paid";
    } else if (action === "reject") {
      appointment.paymentStatus = "rejected";
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    await appointment.save();

    res.json({ message: "Payment status updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (
      req.user.role !== "admin" &&
      req.user._id.toString() !== appointment.patient.toString() &&
      req.user._id.toString() !== appointment.doctor.toString()
    ) {
      return res.status(401).json({ message: "Not authorized" });
    }

    await appointment.deleteOne();

    res.json({ message: "Appointment deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
