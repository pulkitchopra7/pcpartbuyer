const nodemailer = require("nodemailer");

module.exports = async ({ to, text, subject, html }) => {
  let from = "pcpartbuyer@trial-k68zxl2x335gj905.mlsender.net";

  let transportOptions = {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  };

  const transport = nodemailer.createTransport(transportOptions);
  const mailOptions = {
    from,
    to,
    subject,
    text,
    html,
  };
  return await transport.sendMail(mailOptions);
};
