const nodemailer = require('nodemailer');
const { google } = require('googleapis');

// Configuración basada en entorno
const isProduction = process.env.NODE_ENV === 'production';

// Transporte para desarrollo (MailHog)
const devTransporter = nodemailer.createTransport({
  host: 'mailhog', // Nombre del servicio en docker-compose
  port: 1025,
  ignoreTLS: true,
  connectionTimeout: 5000 // Timeout de 5 segundos
});

// Transporte para producción
let prodTransporter;
if (isProduction) {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oAuth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN
  });

  prodTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: process.env.EMAIL_FROM,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      accessToken: accessToken.token
    }
  });
}

module.exports = {
  sendVerificationEmail: async (to, token) => {
    const verificationUrl = `${process.env.BASE_URL}/verify-email?token=${token}`;
    
    const mailOptions = {
      from: `"PongApp" <${process.env.EMAIL_FROM || 'no-reply@pongapp.com'}>`,
      to,
      subject: 'Verifica tu cuenta en PongApp',
      html: `
        <h2>Verificación de cuenta</h2>
        <p>Haz clic en el siguiente enlace para verificar tu cuenta:</p>
        <a href="${verificationUrl}">${verificationUrl}</a>
        <p>Si no solicitaste esto, ignora este email.</p>
      `
    };

    try {
      if (isProduction) {
        await prodTransporter.sendMail(mailOptions);
      } else {
        await devTransporter.sendMail(mailOptions);
        console.log('Email de verificación (dev):', {
          to,
          verificationUrl
        });
      }
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  },

  send2FACode: async (to, code) => {
    const mailOptions = {
      from: `"PongApp" <${process.env.EMAIL_FROM || 'no-reply@pongapp.com'}>`,
      to,
      subject: 'Tu código de verificación 2FA',
      text: `Tu código de verificación es: ${code}`,
      html: `
        <h2>Código de verificación</h2>
        <p>Tu código para iniciar sesión es:</p>
        <h3>${code}</h3>
        <p>Este código expira en 10 minutos.</p>
      `
    };

    try {
      if (isProduction) {
        await prodTransporter.sendMail(mailOptions);
      } else {
        await devTransporter.sendMail(mailOptions);
        console.log('Código 2FA (dev):', { to, code });
      }
      return true;
    } catch (error) {
      console.error('Error sending 2FA code:', error);
      return false;
    }
  }
};