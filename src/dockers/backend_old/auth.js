import crypto from 'crypto';
import { db } from './database.js';

// Configuración mejorada
export const config = {
    secret: process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex'),
    algorithm: 'HS256',
    issuer: 'pong-app.com',
    audience: 'pong-client',
    accessExpiry: '15m',
    refreshExpiry: '7d',
    clockTolerance: 30,
    minPasswordStrength: 3,
    maxDevicesPerUser: 5,
    tempTokenExpiry: '15m',
    tempTokenPurpose: '2fa_verification'
};

// Genera token de acceso con más información de contexto
export const generateAccessToken = (user, request = {}) => {
    if (!user?.id) {
        throw new Error('User ID is required to generate token');
    }

    const payload = {
        id: user.id,
        jti: crypto.randomBytes(16).toString('hex'),
        iss: config.issuer,
        aud: config.audience,
        iat: Math.floor(Date.now() / 1000),
        context: {
            ip: request.ip,
            ua: request.headers?.['user-agent']?.substring(0, 100) || 'unknown'
        },
        role: user.role || 'user',
        auth_method: user.auth_method || 'standard',
        provider: user.provider || 'local',
        two_fa_verified: user.two_fa_verified || false
    };

    return request.jwtsign(payload, config.secret, {
        expiresIn: config.accessExpiry,
        algorithm: config.algorithm
    });
};

// Genera refresh token con validación mejorada
export const generateRefreshToken = async (userId, request = {}) => {
    if (userId === undefined || userId === null) {
        throw new Error(`Invalid user ID: ${userId}`);
    }

    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    const deviceInfo = {
        ip: request.ip,
        userAgent: request.headers?.['user-agent']?.substring(0, 200) || 'unknown',
        createdAt: new Date().toISOString()
    };

    try {
        // Primero verifica que no exceda el límite de dispositivos
        const activeTokens = await db.all(
            `SELECT COUNT(*) as count FROM refresh_tokens 
             WHERE user_id = ? AND expires_at > datetime('now')`,
            [userId]
        );

        if (activeTokens[0]?.count >= config.maxDevicesPerUser) {
            throw new Error('Maximum device limit reached');
        }

        // Inserta el nuevo token
        await db.run(
            `INSERT INTO refresh_tokens 
             (token, user_id, expires_at, device_info) 
             VALUES (?, ?, ?, ?)`,
            [token, userId, expiresAt.toISOString(), JSON.stringify(deviceInfo)]
        );
        
        console.log(`Refresh token generated for user ${userId} from IP ${deviceInfo.ip}`);
        return token;
    } catch (error) {
        console.error('Error generating refresh token:', {
            error: error.message,
            userId,
            stack: error.stack
        });
        throw error;
    }
};

// Revoca token con verificación
export const revokeToken = async (jti) => {
    if (!jti) {
        throw new Error('JTI is required to revoke token');
    }

    try {
        await db.run(
            `INSERT INTO revoked_tokens (jti, expires_at) 
             VALUES (?, datetime('now', '+1 hour'))`,
            [jti]
        );
        console.log(`Token revoked: ${jti}`);
    } catch (error) {
        console.error('Error revoking token:', error);
        throw error;
    }
};

// Verificación de token con chequeo de revocación
export const verifyToken = async (request, token) => {
    if (!token || typeof token !== 'string') {
        throw new Error('Invalid token format');
    }

    try {
        const decoded = await request.jwtVerify();

        // Verificar si el token está revocado
        const revoked = await db.get(
            `SELECT * FROM revoked_tokens 
             WHERE jti = ? AND expires_at > datetime('now')`,
            [decoded.jti]
        );
        
        if (revoked) {
            const error = new Error('Token revoked');
            error.code = 'TOKEN_REVOKED';
            error.statusCode = 401;
            throw error;
        }

        return decoded;
    } catch (err) {
        // Mejorar el manejo de errores
        if (err.name === 'TokenExpiredError') {
            err.statusCode = 401;
            err.code = 'TOKEN_EXPIRED';
        } else if (err.name === 'JsonWebTokenError') {
            err.statusCode = 403;
            err.code = 'INVALID_TOKEN';
        } else {
            err.statusCode = err.statusCode || 403;
            err.code = err.code || 'AUTH_ERROR';
        }
        
        console.error('Token verification failed:', {
            error: err.message,
            code: err.code
        });
        
        throw err;
    }
};

// Verificación de token temporal para 2FA
export const verifyTempToken = async (request, token) => {
    try {
        const decoded = await request.jwtVerify();
        
        console.log('Token temporal decodificado:', {
            decoded,
            expectedPurpose: config.tempTokenPurpose
        });

        if (decoded.purpose !== config.tempTokenPurpose) {
            throw new Error(`Invalid token purpose. Expected: ${config.tempTokenPurpose}`);
        }

        if (!decoded.id) {
            throw new Error('Missing userId in temp token');
        }

        return decoded;
    } catch (error) {
        console.error('Error en verifyTempToken:', {
            error: error.message,
            token,
            stack: error.stack
        });
        throw error;
    }
};

// Middleware de autenticación mejorado
export const authMiddleware = async (request, reply) => {
    try {
        // Verificar header de autorización
        const authHeader = request.headers.authorization;
        if (!authHeader) {
            const error = new Error('Authorization header missing');
            error.code = 'MISSING_AUTH_HEADER';
            throw error;
        }

        // Extraer token
        const [scheme, token] = authHeader.split(' ');
        if (scheme !== 'Bearer' || !token || token.length < 50) {
            const error = new Error('Invalid authorization format');
            error.code = 'INVALID_AUTH_FORMAT';
            throw error;
        }

        // Verificar token
        request.user = await verifyToken(request, token);
        request.token = token;

    } catch (err) {
        // Manejo estructurado de errores
        const statusCode = err.statusCode || 403;
        const errorResponse = {
            error: 'Authentication failed',
            message: err.message,
            code: err.code || 'AUTH_ERROR',
            timestamp: new Date().toISOString()
        };

        // Log detallado
        console.error('Authentication error:', {
            ip: request.ip,
            path: request.url,
            error: errorResponse
        });

        reply.status(statusCode).send(errorResponse);
        throw err; // Opcional: depende del manejo de errores de Fastify
    }
};

