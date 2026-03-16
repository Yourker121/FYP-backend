const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    date: {
      type: String,
    },

    time: {
      type: String,
    },

    reason: {
      type: String,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: ["jazzcash", "easypaisa", "physical"],
    },

    paymentStatus: {
      type: String,
      enum: ["unpaid", "pending_verification", "paid", "rejected"],
      default: "unpaid",
    },

    paymentScreenshot: {
      type: String,
    },

    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
