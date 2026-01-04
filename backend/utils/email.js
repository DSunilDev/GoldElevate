const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@goldinvestment.com',
      to,
      subject,
      html,
      text
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

const sendWelcomeEmail = async (member) => {
  const html = `
    <h1>Welcome to GoldElevate!</h1>
    <p>Dear ${member.firstname} ${member.lastname},</p>
    <p>Thank you for joining our platform. Your account has been created successfully.</p>
    <p>Your login credentials:</p>
    <ul>
      <li>Username: ${member.login}</li>
    </ul>
    <p>Start investing today and earn guaranteed daily returns!</p>
  `;

  return sendEmail({
    to: member.email,
    subject: 'Welcome to GoldElevate',
    html
  });
};

const sendInvestmentConfirmation = async (member, investment) => {
  const html = `
    <h1>Investment Confirmation</h1>
    <p>Dear ${member.firstname} ${member.lastname},</p>
    <p>Your investment of ₹${investment.amount} has been received.</p>
    <p>Package: ${investment.package_name}</p>
    <p>You will start earning daily returns from tomorrow!</p>
  `;

  return sendEmail({
    to: member.email,
    subject: 'Investment Confirmation',
    html
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendInvestmentConfirmation
};




