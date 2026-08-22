import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "abc@gmail.com",
    pass: "123",
  },
});

export const sendEmail = async (to, subject, name) => {
  try {
    const html = `
    <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
      <div style="max-width:600px; margin:auto; background:white; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
        
        <div style="background:#4f46e5; color:white; padding:20px; text-align:center;">
          <h2 style="margin:0;">🏦 Bank System</h2>
        </div>

        <div style="padding:25px;">
          <h3 style="margin-bottom:10px;">Hello ${name},</h3>
          
          <p style="color:#555; font-size:15px;">
            Welcome aboard! 🎉 Your account has been successfully created.
          </p>

          <div style="margin:20px 0; padding:15px; background:#eef2ff; border-left:4px solid #4f46e5;">
            <p style="margin:0; font-weight:500;">
              You can now securely send, receive, and manage your money.
            </p>
          </div>

          <p style="color:#777; font-size:14px;">
            If this wasn’t you, please contact support immediately.
          </p>

          <p style="margin-top:30px;">– Team Bank System 🚀</p>
        </div>

      </div>
    </div>
    `;

    await transporter.sendMail({
      from: "abc@gmail.com",
      to,
      subject,
      html,
    });

    console.log("Email sent successfully");
  } catch (e) {
    console.log("Email error:", e);
  }
};


export const sendTransactionEmail = async (email, name, amount, otherParty, type) => {
  try {
    let subject;
    let message;

    const color = type === "DEBIT" ? "#ef4444" : "#22c55e";
    const title = type === "DEBIT" ? "Money Sent 💸" : "Money Received 💰";

    if (type === "DEBIT") {
      subject = "Money Sent 💸";
      message = `
        <p>You sent <b>₹${amount}</b></p>
        <p>To: <b>${otherParty}</b></p>
      `;
    } else {
      subject = "Money Received 💰";
      message = `
        <p>You received <b>₹${amount}</b></p>
        <p>From: <b>${otherParty}</b></p>
      `;
    }

    const html = `
    <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
      <div style="max-width:600px; margin:auto; background:white; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">

        <div style="background:${color}; color:white; padding:20px; text-align:center;">
          <h2 style="margin:0;">${title}</h2>
        </div>

        <div style="padding:25px;">
          <h3>Hello ${name},</h3>

          <div style="margin:20px 0; padding:20px; background:#f9fafb; border-radius:8px; text-align:center;">
            <h1 style="margin:0; color:${color};">₹${amount}</h1>
            <p style="margin-top:10px; color:#555;">
              ${type === "DEBIT" ? "Amount Debited" : "Amount Credited"}
            </p>
          </div>

          <div style="font-size:15px; color:#444;">
            ${message}
          </div>

          <div style="margin-top:25px; padding:15px; background:#fff7ed; border-left:4px solid #f59e0b;">
            <p style="margin:0; font-size:14px;">
              If you didn’t authorize this transaction, please contact support immediately.
            </p>
          </div>

          <p style="margin-top:30px;">– Secure Banking Team 🔐</p>
        </div>

      </div>
    </div>
    `;

    await transporter.sendMail({
      from: "abc@gmail.com",
      to: email,
      subject,
      html,
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
      from:"abc@gmail.com",
      to: email,
      subject,
      html,
    });

  } catch (err) {
    console.log("Error sending OTP mail:", err);
  }
};