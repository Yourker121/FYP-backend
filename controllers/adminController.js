const User = require("../models/User");
const Appointment = require("../models/Appointment");

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalDoctors = await User.countDocuments({ role: "doctor" });
    const totalPatients = await User.countDocuments({ role: "patient" });
    const totalAppointments = await Appointment.countDocuments();

    res.json({
      totalUsers,
      totalDoctors,
      totalPatients,
      totalAppointments,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};

exports.getAllDoctors = async (req, res) => {
  const doctors = await User.find({ role: "doctor" }).select("-password");
  res.json(doctors);
};

exports.getAllPatients = async (req, res) => {
  const patients = await User.find({ role: "patient" }).select("-password");
  res.json(patients);
};

exports.deleteUser = async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "User deleted" });
};

exports.getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("patient", "name")
      .populate("doctor", "name");

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  const { status } = req.body;

  const appointment = await Appointment.findById(req.params.id);
  appointment.status = status;
  await appointment.save();

  res.json({ message: "Status updated" });
};

exports.deleteAppointment = async (req, res) => {
  await Appointment.findByIdAndDelete(req.params.id);
  res.json({ message: "Appointment deleted" });
};
