import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendVerificationEmail(email, token) {
  const verificationLink = `${process.env.BACKEND_URL}/api/verify-email?token=${token}&email=${encodeURIComponent(email)}`;
  
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

export async function sendResetPasswordEmail(email, token) {
  const verificationLink = `${process.env.FRONTEND_URL}/#newPassword?token=${token}&email=${encodeURIComponent(email)}`;
  
  console.log("configurando mensaje")
  const mailOptions = {
    from: '"PongApp" <no-reply@pongapp.com>',
    to: email,
    subject: 'Correo para resetear tu contraseña',
    html: `<a href="${verificationLink}">Reset</a>`,
    text: `: ${verificationLink}`
  };
  
  try {
    console.log("Enviando mensaje")
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