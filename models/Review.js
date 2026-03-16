const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    rating: { type: Number, min: 1, max: 5, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
