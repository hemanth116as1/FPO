import twilio from "twilio";
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
export async function sendOTP(phoneNumber: string, code: string) {
        const message = await client.messages.create({ 
            body: `Your OTP code is: ${code}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber,
        });
        return message;
}