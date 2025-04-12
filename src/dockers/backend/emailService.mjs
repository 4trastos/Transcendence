import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'mailserver', // nombre del servicio en docker-compose
  port: 25,
  secure: false, // sin TLS
  tls: {
    rejectUnauthorized: false
  }
});

export async function sendVerificationEmail(to: string, code: string) {
  const info = await transporter.sendMail({
    from: '"PongApp" <no-reply@pongapp.com>',
    to,
    subject: 'Verifica tu cuenta',
    text: `Hola, verifica tu cuenta con este código: ${code}`,
    html: `<p>Hola, verifica tu cuenta con este código: <strong>${code}</strong></p>`,
  });

  console.log("Mensaje enviado:", info.messageId);
}
