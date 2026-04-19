import nodemailer from "nodemailer";

// ✅ GLOBAL TRANSPORTER
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "ssvsurajvishwakarma@gmail.com",
    pass: "myqafsbbfytybmxs",
  },
});

// 🔹 Welcome Email
export const sendEmail = async (to, subject, name) => {
  try {
    const html = `
      <h2>🏦 Bank System</h2>
      <h3>Hello ${name}</h3>
      <p>Your account has been created successfully 🚀</p>
    `;

    await transporter.sendMail({
      from: "ssvsurajvishwakarma@gmail.com",
      to,
      subject,
      html,
    });

    console.log("Email sent successfully");
  } catch (e) {
    console.log("Email error:", e);
  }
};

// 🔹 Transaction Email
export const sendTransactionEmail = async (email,name,amount,otherParty,type) => {
  try {
    let subject;
    let message;

    if (type === "DEBIT") {
      subject = "Money Sent 💸";
      message = `
        <h3>Hello ${name}</h3>
        <p>You sent <b>₹${amount}</b></p>
        <p>To: <b>${otherParty}</b></p>
      `;
    } else {
      subject = "Money Received 💰";
      message = `
        <h3>Hello ${name}</h3>
        <p>You received <b>₹${amount}</b></p>
        <p>From: <b>${otherParty}</b></p>
      `;
    }

    await transporter.sendMail({
      from: "ssvsurajvishwakarma@gmail.com",
      to: email,
      subject,
      html: message,
    });

    console.log("Transaction email sent");
  } catch (err) {
    console.log("Transaction email error:", err);
  }
};

export const otpMail = async (email, name, otp) => {
  try {
    const subject = "🔐 Reset Your Password - Apex Trust";

    const html = `
    <div style="font-family: Arial, sans-serif; background-color:#f4f6f8; padding:20px;">
      
      <div style="max-width:600px; margin:auto; background:white; padding:30px; border-radius:10px; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
        
        <h2 style="color:#2c3e50; text-align:center;">🏦 Apex Trust</h2>
        
        <p style="font-size:16px;">Hello <strong>${name}</strong>,</p>
        
        <p style="font-size:15px; color:#555;">
          We received a request to reset your account password.
        </p>

        <div style="text-align:center; margin:30px 0;">
          <span style="
            display:inline-block;
            font-size:28px;
            letter-spacing:5px;
            font-weight:bold;
            background:#f1f3f6;
            padding:15px 25px;
            border-radius:8px;
            color:#2c3e50;
          ">
            ${otp}
          </span>
        </div>

        <p style="font-size:14px; color:#777;">
          This OTP is valid for <strong>5 minutes</strong>. Do not share it with anyone.
        </p>

        <p style="font-size:14px; color:#777;">
          If you didn’t request this, you can safely ignore this email.
        </p>

        <hr style="margin:25px 0; border:none; border-top:1px solid #eee;" />

        <p style="font-size:12px; color:#aaa; text-align:center;">
          © ${new Date().getFullYear()} Apex Trust. All rights reserved.
        </p>

      </div>
    </div>
    `;

    await transporter.sendMail({
      from:"ssvsurajvishwakarma@gmail.com",
      to: email,
      subject,
      html,
    });

  } catch (err) {
    console.log("Error sending OTP mail:", err);
  }
};