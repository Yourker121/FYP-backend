const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant for a medical appointment system. Answer in 2-3 short sentences only. No bullet points.

PATIENT:
- To book an appointment: Login as patient, go to Patient Dashboard, select a doctor, choose date and time, and click "Book Appointment".
- To make a payment: After booking, go to the Payment section, enter your card details via Stripe, and confirm payment.
- Appointments are confirmed once payment is done and doctor approves.

DOCTOR:
- To approve or reject an appointment: Login as doctor, go to Doctor Dashboard, view pending appointments, and click "Approve" or "Reject".
- Payment is handled automatically by the system via Stripe.

ADMIN:
- Admin can manage all users, doctors, and appointments from the Admin Dashboard.
- Admin can approve or reject doctor registrations.`,
        },
        { role: "user", content: message },
      ],
      model: "llama-3.3-70b-versatile",
      max_tokens: 60,
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error("Groq Error:", error);
    res.status(500).json({ error: "AI server error" });
  }
});

module.exports = router;
