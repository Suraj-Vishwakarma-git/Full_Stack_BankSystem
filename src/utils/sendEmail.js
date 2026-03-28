import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, name) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user:"ssvsurajvishwakarma@gmail.com",
        pass:"vuuwfcejesoroogz",
      },
    });

    const html = `
      <div style="font-family: Arial, sans-serif; background:#f4f6f8; padding:20px;">
        <div style="max-width:500px; margin:auto; background:white; border-radius:10px; overflow:hidden; box-shadow:0 5px 15px rgba(0,0,0,0.1);">

          <!-- Header -->
          <div style="background:#4CAF50; color:white; padding:20px; text-align:center;">
            <h2>🏦 Bank System</h2>
          </div>

          <!-- Body -->
          <div style="padding:20px; color:#333;">
            <h3>Hello ${name} 👋</h3>
            <p style="font-size:15px;">
              Welcome to <b>Bank System</b>! Your account has been created successfully.
            </p>

            <div style="margin:20px 0; padding:15px; background:#f1f1f1; border-radius:8px; text-align:center;">
              <p style="margin:0; font-size:14px;">We're glad to have you onboard 🚀</p>
            </div>

            <p style="font-size:14px; color:#666;">
              If you did not create this account, please contact support immediately.
            </p>
          </div>

          <!-- Footer -->
          <div style="background:#fafafa; padding:15px; text-align:center; font-size:12px; color:#888;">
            © 2026 Bank System • All rights reserved
          </div>

        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from:"ssvsurajvishwakarma@gmail.com",
      to,
      subject,
      html, 
    });

    console.log("Email sent:", info.response);

  } catch (e) {
    console.log(e);
  }
};

export const sendTransactionEmail = async (
  email,
  name,
  amount,
  otherParty,
  type
) => {
  let subject;
  let message;

  if (type === "DEBIT") {
    subject = "Money Sent 💸";
    message = `
      <h3>Hello ${name}</h3>
      <p>You have successfully <b>sent ₹${amount}</b></p>
      <p>To Account: <b>${otherParty}</b></p>
    `;
  } else {
    subject = "Money Received 💰";
    message = `
      <h3>Hello ${name}</h3>
      <p>You have <b>received ₹${amount}</b></p>
      <p>From Account: <b>${otherParty}</b></p>
    `;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject,
    html: message,
  });
};