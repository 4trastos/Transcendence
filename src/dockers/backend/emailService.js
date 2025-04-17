const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'mailserver',
  port: 25,  // Puerto INTERNO del contenedor SMTP
  secure: false,
  ignoreTLS: true,  // Crucial para namshi/smtp
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 10000
});

async function sendVerificationEmail(email, token) {
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  
  const mailOptions = {
    from: '"PongApp" <no-reply@pongapp.com>',
    to: email,
    subject: 'Verifica tu cuenta en PongApp',
    html: `<a href="${verificationLink}">Verifica tu cuenta</a>`,
    text: `Por favor verifica tu cuenta: ${verificationLink}`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email enviado:', info.messageId);
    return true;
  } catch (error) {
    console.error('ERROR al enviar email:', {
      error: error.message,
      stack: error.stack,
      email: email
    });
    return false;
  }
}

module.exports = { sendVerificationEmail };