const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { generateAccessToken, generateRefreshToken } = require('./auth');
const db = require('./database');

const verifyGoogleToken = async (tokenId) => {
  const ticket = await client.verifyIdToken({
    idToken: tokenId,
    audience: process.env.GOOGLE_CLIENT_ID
  });
  
  return ticket.getPayload();
};

const findOrCreateUser = async (googleUser) => {
  // Buscar usuario existente
  let user = await db.get(
    'SELECT * FROM users WHERE email = ? AND auth_provider = "google"',
    [googleUser.email]
  );

  if (!user) {
    // Crear nuevo usuario
    const result = await db.run(
      `INSERT INTO users 
      (username, email, auth_provider, google_id, is_verified, is_active) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        googleUser.email.split('@')[0],
        googleUser.email,
        'google',
        googleUser.sub,
        1, // is_verified
        1  // is_active
      ]
    );
    
    user = {
      id: result.lastID,
      email: googleUser.email,
      username: googleUser.email.split('@')[0],
      auth_provider: 'google'
    };
  }

  return user;
};

module.exports = {
  authenticateWithGoogle: async (tokenId) => {
    try {
      const googleUser = await verifyGoogleToken(tokenId);
      const user = await findOrCreateUser(googleUser);
      
      // Verificar si requiere 2FA
      if (user.two_factor_enabled) {
        const tempToken = crypto.randomBytes(32).toString('hex');
        await db.run(
          'INSERT INTO two_fa_tokens (user_id, token, expires_at) VALUES (?, ?, datetime("now", "+15 minutes"))',
          [user.id, tempToken]
        );
        
        return {
          requires2FA: true,
          tempToken,
          userId: user.id
        };
      }

      // Generar tokens JWT
      const accessToken = generateAccessToken({
        id: user.id,
        role: user.role || 'user',
        auth_method: 'google'
      });
      
      const refreshToken = await generateRefreshToken(user.id);
      
      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      };
    } catch (error) {
      console.error('Google authentication error:', error);
      throw new Error('Google authentication failed');
    }
  }
};