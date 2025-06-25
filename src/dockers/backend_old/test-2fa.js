const speakeasy = require('speakeasy');
const axios = require('axios');

// Configuración
const SECRET = 'KRXGW7JFN4ZXWSCGMM4HMUCFOAYHW3DO'; // Usa el secreto de tu usuario
const USER_ID = 2; // Cambia esto por el ID correcto de tu usuario
const TEMP_TOKEN = 'testtoken'; // O usa el token temporal real de la BD

// Generar código 2FA válido
const generateValidCode = () => {
  return speakeasy.totp({
    secret: SECRET,
    encoding: 'base32'
  });
};

// Prueba de verificación 2FA
const test2FAVerification = async () => {
  try {
    const code = generateValidCode();
    console.log('Código generado:', code);

    const response = await axios.post('http://localhost:3000/api/verify-2fa', {
      userId: USER_ID,
      code: code,
      tempToken: TEMP_TOKEN
    });

    console.log('✅ Verificación exitosa:', response.data);
  } catch (error) {
    console.error('❌ Error en verificación:');
    if (error.response) {
      console.error('Detalles del error:', error.response.data);
    } else {
      console.error('Error de conexión:', error.message);
    }
  }
};

// Ejecutar prueba
test2FAVerification();