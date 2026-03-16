const User = require("../models/User");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "Email already registered" });

    const newUser = await User.create({
      name,
      email,
      password,
      role,
      isVerified: false,
    });

    const verificationToken = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    const verificationURL = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify your account",
      html: `
        <h2>Hello ${name}</h2>
        <p>Please click the button below to verify your account:</p>
        <a href="${verificationURL}" 
        style="padding:10px 20px;background:#4f46e5;color:white;text-decoration:none;border-radius:5px;">
        Verify Account
        </a>
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      message: "Registration successful! Please check your email to verify.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyEmail = async (req, res) => {
  const { token } = req.query;

  if (!token) return res.status(400).send("Invalid verification token");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) return res.status(404).send("User not found");
    if (user.isVerified) return res.send("Account already verified");

    user.isVerified = true;
    await user.save();

    res.send("✅ Email verified successfully! You can now login.");
  } catch (error) {
    res.status(400).send("❌ Verification failed or token expired");
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    if (!user.isVerified)
      return res
        .status(400)
        .json({ message: "Please verify your email first" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "No account with this email" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetTokenExpire = Date.now() + 3600000;
    await user.save();

    const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&id=${user._id}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset your password",
      html: `
        <h2>Hello ${user.name}</h2>
        <p>Click the button below to reset your password. This link is valid for 1 hour.</p>
        <a href="${resetURL}" 
        style="padding:10px 20px;background:#4f46e5;color:white;text-decoration:none;border-radius:5px;">
        Reset Password
        </a>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Password reset email sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const resetPassword = async (req, res) => {
  const { token, id } = req.query;
  const { password } = req.body;

  if (!token || !id)
    return res.status(400).json({ message: "Invalid request" });

  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      _id: id,
      resetToken: hashedToken,
      resetTokenExpire: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired token" });

    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;

    await user.save();

    res.json({ message: "✅ Password reset successfully! You can now login." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  verifyEmail,
  loginUser,
  forgotPassword,
  resetPassword,
};
