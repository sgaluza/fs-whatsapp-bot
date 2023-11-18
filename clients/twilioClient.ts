import Twilio from 'twilio';

// Load your Twilio credentials from environment variables or a configuration file
const accountSid = process.env.TWILIO_SID; // Your Twilio Account SID
const authToken = process.env.TWILIO_SECRET;   // Your Twilio Auth Token

// Initialize the Twilio client
const twilioClient = Twilio(accountSid, authToken);

export { twilioClient };
