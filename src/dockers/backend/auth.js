const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Configuración mejorada del secreto JWT
if (!process.env.JWT_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('❌ JWT_SECRET must be defined in production environment');
    }
    console.warn('⚠️  Using temporary JWT secret. For production, set JWT_SECRET in your environment variables');
}

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_ALGORITHM = 'HS256';
const JWT_ISSUER = 'pong-app.com';
const JWT_AUDIENCE = 'pong-client';
const JWT_EXPIRES_IN = '1h';

module.exports = {
    JWT_SECRET,
    JWT_ALGORITHM,
    
    generateToken: (user) => {
        const tokenPayload = {
            sub: user.id,
            jti: crypto.randomBytes(16).toString('hex'),
            iss: JWT_ISSUER,
            aud: JWT_AUDIENCE,
            iat: Math.floor(Date.now() / 1000),
            id: user.id,
            role: user.role || 'user',
            auth_method: user.authMethod || 'standard'
        };

        return jwt.sign(tokenPayload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN,
            algorithm: JWT_ALGORITHM
        });
    },

    verifyToken: (req, res, next) => {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Formato de autorización inválido. Use: Bearer <token>' });
        }
    
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Token no proporcionado' });
        }
    
        jwt.verify(token, JWT_SECRET, {
            algorithms: ['HS256'],
            issuer: 'pong-app.com',
            audience: 'pong-client'
        }, (err, decoded) => {
            if (err) {
                console.error('Error al verificar token:', err);
                return res.status(401).json({ error: 'Token inválido' });
            }
            
            req.user = decoded;
            next();
        });
    },

    middleware: (req, res, next) => {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ 
                error: 'Authorization header missing',
                code: 'MISSING_AUTH_HEADER'
            });
        }

        const [scheme, token] = authHeader.split(' ');
        
        if (scheme !== 'Bearer' || !token) {
            return res.status(401).json({ 
                error: 'Invalid authorization format. Expected: Bearer <token>',
                code: 'INVALID_AUTH_FORMAT'
            });
        }

        try {
            const decoded = this.verifyToken(token);
            req.user = {
                id: decoded.id,
                role: decoded.role,
                authMethod: decoded.auth_method,
                sessionId: decoded.jti
            };
            next();
        } catch (err) {
            const errorMap = {
                TokenExpiredError: {
                    status: 401,
                    error: 'Token expired',
                    code: 'TOKEN_EXPIRED'
                },
                JsonWebTokenError: {
                    status: 403,
                    error: 'Invalid token',
                    code: 'INVALID_TOKEN'
                },
                NotBeforeError: {
                    status: 403,
                    error: 'Token not active',
                    code: 'TOKEN_NOT_ACTIVE'
                }
            };

            const response = errorMap[err.name] || {
                status: 403,
                error: 'Authentication failed',
                code: 'AUTH_FAILED'
            };

            return res.status(response.status).json(response);
        }
    }
};