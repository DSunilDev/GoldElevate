const twilio = require('twilio');

let client = null;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
}

const sendSMS = async ({ to, message }) => {
  if (!client) {
    console.warn('Twilio not configured, SMS not sent');
    return { success: false, message: 'SMS service not configured' };
  }

  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });

    return { success: true, messageId: result.sid };
  } catch (error) {
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

const sendInvestmentSMS = async (phone, amount, packageName) => {
  const message = `Your investment of ₹${amount} for ${packageName} has been confirmed. You will start earning daily returns from tomorrow!`;
  return sendSMS({ to: phone, message });
};

module.exports = {
  sendSMS,
  sendInvestmentSMS
};




