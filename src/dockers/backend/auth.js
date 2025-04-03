// backend/auth.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Configuración del secreto
const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

const auth = {
  generateToken: (user) => {
    return jwt.sign(
      {
        id: user.id,
        session: user.session // Mantén compatibilidad
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  },

  verifyToken: (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Formato de token inválido' });
    }

    const token = parts[1];
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('Error al verificar token:', err.message);
        return res.status(403).json({ error: 'Token inválido o expirado' });
      }
      
      req.user = decoded;
      next();
    });
  }
};

module.exports = auth;