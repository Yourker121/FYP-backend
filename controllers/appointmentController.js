const Appointment = require("../models/Appointment");
const User = require("../models/User");

exports.createAppointment = async (req, res) => {
  try {
    const { doctorId, date, time, reason } = req.body;

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      date,
      time,
      reason,
    });

    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patient: req.user._id,
    }).populate("doctor", "name email");

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDoctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      doctor: req.user._id,
    }).populate("patient", "name email");

    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
