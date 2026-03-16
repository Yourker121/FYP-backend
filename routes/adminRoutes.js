const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getAllUsers,
  getAllDoctors,
  getAllPatients,
  deleteUser,
  getAllAppointments,
  updateAppointmentStatus,
  deleteAppointment,
} = require("../controllers/adminController");

const { protect, adminOnly } = require("../middleware/authMiddleware");

router.get("/dashboard", protect, adminOnly, getDashboardStats);

router.get("/users", protect, adminOnly, getAllUsers);
router.get("/doctors", protect, adminOnly, getAllDoctors);
router.get("/patients", protect, adminOnly, getAllPatients);

router.delete("/users/:id", protect, adminOnly, deleteUser);

router.get("/appointments", protect, adminOnly, getAllAppointments);
router.put("/appointments/:id", protect, adminOnly, updateAppointmentStatus);
router.delete("/appointments/:id", protect, adminOnly, deleteAppointment);

module.exports = router;
