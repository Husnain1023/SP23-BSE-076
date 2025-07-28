// utils/mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendMail(to, subject, htmlContent) {
  try {
    const info = await transporter.sendMail({
      from: `"Buy & Shop" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent
    });

    console.log('Email sent:', info.messageId);
  } catch (error) {
    console.error('Email failed:', error);
  }
}

module.exports = sendMail;
