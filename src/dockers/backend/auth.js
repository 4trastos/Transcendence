const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('./database'); // Asume conexión a DB

// Configuración centralizada
const config = {
    secret: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
    algorithm: 'HS256',
    issuer: 'pong-app.com',
    audience: 'pong-client',
    accessExpiry: '15m',
    refreshExpiry: '7d',
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    googleRedirectUri: process.env.GOOGLE_REDIRECT_URI
};

// Nuevas funciones añadidas
const tokenUtils = {
    generateAccessToken: (user) => {
        const payload = {
            sub: user.id,
            jti: crypto.randomBytes(16).toString('hex'),
            iss: config.issuer,
            aud: config.audience,
            iat: Math.floor(Date.now() / 1000),
            role: user.role || 'user',
            auth_method: user.auth_method || 'standard', // 'google' o 'standard'
            provider: user.provider || 'local' // 'google' o 'local'
        };
        return jwt.sign(payload, config.secret, {
            expiresIn: config.accessExpiry,
            algorithm: config.algorithm
        });
    },

    generateRefreshToken: async (userId) => {
        if (!userId) {
            throw new Error('userId es requerido para generar refresh token');
        }
        
        const token = crypto.randomBytes(64).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        
        await db.run(
            `INSERT INTO refresh_tokens (token, user_id, expires_at) 
             VALUES (?, ?, ?)`,
            [token, userId, expiresAt.toISOString()]
        );
        return token;
    },

    revokeToken: async (jti) => {
        await db.run(
            `INSERT INTO revoked_tokens (jti, expires_at) 
             VALUES (?, datetime('now', '+1 hour'))`,
            [jti]
        );
    },

    verifyToken: async (token) => {
        const decoded = jwt.verify(token, config.secret, {
            algorithms: [config.algorithm],
            issuer: config.issuer,
            audience: config.audience
        });

        const isRevoked = await db.get(
            'SELECT 1 FROM revoked_tokens WHERE jti = ?',
            [decoded.jti]
        );
        if (isRevoked) throw new Error('Token revoked');
        
        return decoded;
    }
};

// Middleware actualizado
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) throw new Error('Missing token');

        req.user = await tokenUtils.verifyToken(token);
        next();
    } catch (err) {
        res.status(401).json({
            error: 'Authentication failed',
            details: err.message,
            code: err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'AUTH_ERROR'
        });
    }
};

module.exports = {
    ...tokenUtils,
    middleware: authMiddleware,
    config,
    googleAuth: require('./googleAuth')
};