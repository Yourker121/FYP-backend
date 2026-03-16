const cron = require("node-cron");
const nodemailer = require("nodemailer");
const Appointment = require("../models/Appointment");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const appointments = await Appointment.find({
      status: "approved",
      reminderSent: false,
    })
      .populate("patient")
      .populate("doctor");

    for (let appointment of appointments) {
      const appointmentDate = new Date(appointment.date);

      if (appointmentDate >= now && appointmentDate <= oneHourLater) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: appointment.patient.email,
          subject: "Appointment Reminder",
          html: `
            <h2>Appointment Reminder</h2>
            <p>Your appointment is in 1 hour</p>
            <p><b>Doctor:</b> ${appointment.doctor.name}</p>
            <p><b>Date:</b> ${appointment.date}</p>
            <p><b>Time:</b> ${appointment.time}</p>
          `,
        });

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: appointment.doctor.email,
          subject: "Upcoming Appointment",
          html: `
            <h2>Appointment Reminder</h2>
            <p>You have an appointment in 1 hour</p>
            <p><b>Patient:</b> ${appointment.patient.name}</p>
            <p><b>Date:</b> ${appointment.date}</p>
            <p><b>Time:</b> ${appointment.time}</p>
          `,
        });

        appointment.reminderSent = true;
        await appointment.save();
      }
    }
  } catch (error) {
    console.log("Reminder Error:", error);
  }
});
