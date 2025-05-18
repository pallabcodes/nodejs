// Nodemailer
import nodemailer from 'nodemailer';

// Path
import path from 'path';

// Read the HTML email template file
const emailTemplatePath = path.join(__dirname, '../views/email/template.ejs');

// Email content with template variables
const mailOption = {
    from: `"${process.env.APP_NAME || 'smartvalut'}" <${process.env.MAIL_FROM_ADDRESS || 'noreply@smartvalut.co.il'}>`,
    to: process.env.MAIL_TO_ADDRESS || 'admin@smartvalut.co.il',
    subject: 'Email Default Subject.',
};

var transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'ssl://smtp.googlemail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
        user: process.env.MAIL_USERNAME || 'anupamnodejs1@gmail.com',
        pass: process.env.MAIL_PASSWORD || 'znay cawa jezr yrxf'
    }
});

// Verify connection configuration
transporter.verify((err, info) => {
    try {
        console.log('Server is ready to take our messages: ', info);
    } catch (error) {
        console.error(error);
    }
});

export  { transporter, emailTemplatePath, mailOption};