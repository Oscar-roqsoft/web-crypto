const cache = require("../db/cache");

const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTPEmail = async (user, accessToken) => {
  const otp = Math.floor(10000 + Math.random() * 90000).toString();

  // Save for 10 minutes
  const key = `otp:${user.email.toLowerCase().trim()}`;

  cache.set(key, otp.toString(), 600);

  // console.log("Saved OTP:", key, otp);

  const verificationLink = `${process.env.APP_URL}/verify-email?codeInfo=${otp}/${accessToken}`;

  await resend.emails.send({
    from: process.env.FROM_EMAIL,
    to: user.email,
    subject: "Verify your account",
    html: `
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="UTF-8">
        </head>

        <body style="background:#f5f7fb;font-family:Arial,sans-serif;padding:20px;">

        <div style="min-width:300px;margin:auto;background:white;border-radius:12px;padding:20px;">

        <h2 style="margin-top:0;">
        Hello ${user.name},
        </h2>

        <p>
        Welcome to <strong>Quantum Financial system</strong>.
        </p>

        <p>
        Use the verification code below:
        </p>

        <div
        style="
        background:#0057ff;
        color:white;
        font-size:34px;
        font-weight:bold;
        padding:18px;
        text-align:center;
        border-radius:12px;
        letter-spacing:8px;
        margin:25px 0;
        ">
        ${otp}
        </div>

        <p>
        This code expires in <strong>10 minutes</strong>.
        </p>

        <p style="text-align:center;margin:35px 0;">

        <a
        href="${verificationLink}"
        style="
        background:#0057ff;
        color:white;
        padding:14px 30px;
        border-radius:8px;
        text-decoration:none;
        display:inline-block;
        font-weight:bold;
        ">
        Verify Account
        </a>

        </p>

        <p>
        If you didn't request this email, simply ignore it.
        </p>

        <hr>

        <p style="font-size:12px;color:#888;">
        © ${new Date().getFullYear()} Quantum Financial system
        </p>

        </div>

        </body>
        </html>
        `,
  });
  return otp;
};


const sendWelcomeEmail = async (user) => {
  await resend.emails.send({
    from: process.env.FROM_EMAIL,
    to: user.email,
    subject: "🎉 Welcome to Quantum Financial system",
    html: `
        <!DOCTYPE html>
        <html>

        <body
        style="
        background:#f5f7fb;
        font-family:Arial,sans-serif;
        padding:20px;
        ">

        <div
        style="
        min-width:300px;
        margin:auto;
        background:white;
        padding:20px;
        border-radius:14px;
        ">

                <h1 style="color:#0057ff;">
                Welcome, ${user.name}! 🎉
                </h1>

                <p>
                We're excited to have you join <strong>Quantum Financial system</strong>.
                </p>

                <p>
                Your account has been created successfully.
                </p>

                <h3>Here's what you can do next:</h3>

                <ul>
                <li>✔ Verify your identity</li>
                <li>✔ Deposit cryptocurrency</li>
                <li>✔ Buy & Sell Crypto</li>
                <li>✔ Withdraw funds securely</li>
                <li>✔ Enable Two-Factor Authentication</li>
                </ul>

                <div style="text-align:center;margin-top:40px;">

                <a
                href="${process.env.APP_URL}/dashboard"
                style="
                background:#0057ff;
                color:white;
                padding:15px 35px;
                border-radius:8px;
                text-decoration:none;
                font-weight:bold;
                ">
                Go to Dashboard
                </a>

                </div>

                <hr style="margin:40px 0;">

                <p style="font-size:13px;color:#888;">
                Need help?
                Contact our support team anytime.
                </p>

                <p style="font-size:12px;color:#999;">
                © ${new Date().getFullYear()} Quantum Financial system. All rights reserved.
                </p>

                </div>

                </body>

                </html>
        `,
          });
};


module.exports = { sendOTPEmail,sendWelcomeEmail  };