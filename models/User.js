const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      required: true,
    },
    isVerified: { type: Boolean, default: false },

    availability: {
      days: {
        type: [String],
        default: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday`",
          "Saturday",
        ],
      },
      startTime: {
        type: String,
        default: "12:00",
      },
      endTime: {
        type: String,
        default: "22:00",
      },
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model("User", userSchema);
