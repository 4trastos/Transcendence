const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { db } = require('./database');

// Configuración mejorada
const config = {
    secret: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
    algorithm: 'HS256',
    issuer: 'pong-app.com',
    audience: 'pong-client',
    accessExpiry: '15m',
    refreshExpiry: '7d',
    clockTolerance: 30
};

const tokenUtils = {
    generateAccessToken: (user) => {
        const payload = {
            sub: user.id,
            jti: crypto.randomBytes(16).toString('hex'),
            iss: config.issuer,
            aud: config.audience,
            iat: Math.floor(Date.now() / 1000),
            role: user.role || 'user',
            auth_method: user.auth_method || 'standard',
            provider: user.provider || 'local',
            two_fa_verified: true
        };
        return jwt.sign(payload, config.secret, {
            expiresIn: config.accessExpiry,
            algorithm: config.algorithm
        });
    },

    generateRefreshToken: async (userId) => {
        console.log('Generando refresh token para userId:', userId); // Log de diagnóstico
        
        if (userId === undefined || userId === null) {
            throw new Error(`userId inválido: ${userId}`);
        }
    
        const token = crypto.randomBytes(64).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);
        
        try {
            const result = await db.run(
                `INSERT INTO refresh_tokens (token, user_id, expires_at) 
                 VALUES (?, ?, ?)`,
                [token, userId, expiresAt.toISOString()]
            );
            
            console.log('Refresh token generado exitosamente para userId:', userId);
            return token;
        } catch (error) {
            console.error('Error al generar refresh token:', {
                error: error.message,
                userId,
                stack: error.stack
            });
            throw error;
        }
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
            audience: config.audience,
            clockTolerance: config.clockTolerance
        });

        const isRevoked = await db.get(
            'SELECT 1 FROM revoked_tokens WHERE jti = ?',
            [decoded.jti]
        );
        if (isRevoked) throw new Error('Token revoked');
        
        return decoded;
    }
};

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) throw new Error('Authorization header missing');

        const [scheme, token] = authHeader.split(' ');
        if (scheme !== 'Bearer' || !token) throw new Error('Invalid authorization format');

        req.user = await tokenUtils.verifyToken(token);
        next();
    } catch (err) {
        console.error('Authentication error:', err);
        const statusCode = err.name === 'TokenExpiredError' ? 401 : 403;
        res.status(statusCode).json({
            error: 'Authentication failed',
            details: err.message,
            code: err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'AUTH_ERROR'
        });
    }
};

module.exports = {
    ...tokenUtils,
    middleware: authMiddleware,
    config
};