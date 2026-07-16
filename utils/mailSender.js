const nodemailer = require('nodemailer');

const sendMail = async ({email, subject, message}) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: env.MAIL,
        pass: env.MAIL_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: env.MAIL_USERNAME,
      to: options.email,
      subject: options.subject,
      text: options.message
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.log('Failed to send mail', error);
    return false;
  }
};

module.exports = sendMail;