require('dotenv').config()
const { Resend } = require('resend')


/* all returned true and false are just a job of the 
resend functionality so dont confuse with it...
the service is just doing his work..*/

const sendEmail = async ({ to, subject, text, html }) => {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.error('No Valid Resend API Key...');
            return true
        }

        //Step 1:[Hypothetically] Logging in the resend API with unique API key
        const resend = new Resend(process.env.RESEND_API_KEY)

        //step 2 : Calling Built-in Functionlality of resend service
        const { data, error } = await resend.emails.send({
            from: process.env.FROM_EMAIL,  //sender Address
            to: [to],  //resend service expects [] for to
            subject: subject,
            text: text,
            html: html
        })
        if (error) {
            console.error(`[Email] Resend API Error`, error)
            return false
        }
        console.debug(`[Email] Dispatched via Resend to ${to} (${data.id})`)
        return true
    } catch (error) {
        console.error(`[Email] Delivery completely failed:`, error);
        return false;
    }
}
module.exports = { sendEmail };
