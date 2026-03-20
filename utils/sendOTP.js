// sendOTP.js
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const cache = require('../db/cache');
require('dotenv').config();

// Nodemailer transport using Mailjet SMTP
const transporter = nodemailer.createTransport({
//   host: 'in-v3.mailjet.com',
 host:"smtp.ethereal.email",
  port: 587,
  secure: false, // true for 465
  auth: {
    user: process.env.test_mail_user, 
    pass: process.env.test_mail_pass,
  },
});

const sendOTP = async (user, accessToken) => {

  // Generate 5-digit OTP
  const otp = Math.floor(10000 + Math.random() * 90000);

  // Store OTP in cache / Redis
  cache.set(user.email, otp.toString(), 600); // 10 min TTL
  console.log("OTP SAVED:", user.email, otp);
  const storedOTP = cache.get(user.email);
    // console.log(storedOTP,user.email)

  const verificationLink = `${process.env.APP_URL}/verify-email?codeInfo=${otp}/${accessToken}`;

  // Send email
  await transporter.sendMail({
    from: `"HUSHLAD Team" <${process.env.FROM_EMAIL}>`, // must be verified sender
    to: user.email,
    subject: 'Verify Your Account',
    text: `Hello ${user.name}, your verification code is ${otp}. This code expires in 10 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif; max-width:600px; margin:20px auto;">
        <h2>Hello ${user.name},</h2>
        <p>Your verification code is:</p>
        <h1 style="color:#0051ff">${otp}</h1>
        <p>Or click <a href="${verificationLink}">here</a> to verify directly.</p>
        <p>This code expires in 10 minutes.</p>
      </div>
    `,
  });


  console.log('OTP email sent to', user.email);
  
  return otp;

};

module.exports = sendOTP;