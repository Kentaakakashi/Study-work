const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendWelcomeEmail = functions.auth.user().onCreate(async (user) => {

  if (!user.email) return null;

  const mailOptions = {
    from: `Study Zen <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Welcome to Study Zen ⚡",
    html: `
      <h2>Welcome to Study Zen</h2>
      <p>Your account is ready.</p>
      <p>Focus. Plan. Grow.</p>
      <a href="https://study-zen.netlify.app"
      style="padding:12px 20px;background:#00d1b2;color:white;border-radius:6px;text-decoration:none;">
      Open Study Zen
      </a>
    `
  };

  return transporter.sendMail(mailOptions);
});
