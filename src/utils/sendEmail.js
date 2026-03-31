import nodemailer from "nodemailer";

// ✅ GLOBAL TRANSPORTER
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "ssvsurajvishwakarma@gmail.com",
    pass: "vuuwfcejesoroogz",
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
export const sendTransactionEmail = async (
  email,
  name,
  amount,
  otherParty,
  type
) => {
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