import crypto from 'crypto';

// La configuración específica de JWT (secreto, algoritmo, etc.) ahora reside en fastify.jwt.options
// en configApp.js. Aquí solo mantenemos configuraciones generales.
export const config = {
    tempTokenPurpose: '2fa_verification'
};

/**
 * Genera un token de acceso JWT.
 * @param {object} user - Objeto de usuario con al menos 'id'.
 * @param {import('fastify').FastifyInstance} fastifyInstance - La instancia de Fastify.
 * @param {object} request - Objeto de solicitud de Fastify (para contexto como IP, User-Agent).
 * @returns {string} El token de acceso JWT.
 * @throws {Error} Si falta el ID de usuario o la instancia de Fastify/JWT.
 */
export const generateAccessToken = (user, fastifyInstance, request = {}) => {
    if (!user?.id) {
        throw new Error('User ID is required to generate token');
    }
    if (!fastifyInstance || !fastifyInstance.jwt) {
        throw new Error('Fastify instance with JWT plugin is required to generate access token');
    }

    const payload = {
        id: user.id,
        jti: crypto.randomBytes(16).toString('hex'), // JWT ID para revocación
        iss: fastifyInstance.jwt.options.issuer, // Usar issuer del plugin JWT
        aud: fastifyInstance.jwt.options.audience, // Usar audience del plugin JWT
        iat: Math.floor(Date.now() / 1000), // Issued at
        context: {
            ip: request.ip || 'unknown',
            ua: request.headers?.['user-agent']?.substring(0, 100) || 'unknown'
        },
        role: user.role || 'user',
        auth_method: user.auth_method || 'standard',
        provider: user.provider || 'local',
        two_fa_verified: user.two_fa_verified || false
    };

    // Usar fastifyInstance.jwt.sign con las opciones configuradas en el plugin
    return fastifyInstance.jwt.sign(payload, { expiresIn: fastifyInstance.jwt.options.accessExpiry });
};

/**
 * Genera un token de refresco y lo persiste en la base de datos.
 * @param {number} userId - El ID del usuario.
 * @param {import('fastify').FastifyInstance} fastifyInstance - La instancia de Fastify (para acceder a opciones JWT).
 * @param {object} db - La instancia de la base de datos SQLite.
 * @param {object} request - Objeto de solicitud de Fastify (para contexto como IP, User-Agent).
 * @returns {Promise<string>} El token de refresco generado.
 * @throws {Error} Si falta el ID de usuario, la instancia de DB o Fastify/JWT, o se excede el límite de dispositivos.
 */
export const generateRefreshToken = async (userId, fastifyInstance, db, request = {}) => {
    if (userId === undefined || userId === null) {
        throw new Error(`Invalid user ID: ${userId}`);
    }
    if (!db) {
        throw new Error('Database instance is required to generate refresh token');
    }
    if (!fastifyInstance || !fastifyInstance.jwt) {
        throw new Error('Fastify instance with JWT plugin is required for refresh token options');
    }

    const token = crypto.randomBytes(64).toString('hex');
    const expiresAt = new Date();
    // Usar refreshExpiry del plugin JWT
    const refreshExpiryDays = parseInt(fastifyInstance.jwt.options.refreshExpiry.replace('d', ''));
    expiresAt.setDate(expiresAt.getDate() + refreshExpiryDays);
    
    const deviceInfo = {
        ip: request.ip || 'unknown',
        userAgent: request.headers?.['user-agent']?.substring(0, 200) || 'unknown',
        createdAt: new Date().toISOString()
    };

    try {
        // Primero verifica que no exceda el límite de dispositivos (usando maxDevicesPerUser de fastify.jwt options)
        const activeTokens = await db.all(
            `SELECT COUNT(*) as count FROM refresh_tokens 
             WHERE user_id = ? AND expires_at > datetime('now') AND revoked = 0`,
            [userId]
        );

        if (activeTokens[0]?.count >= (fastifyInstance.jwt.options.maxDevicesPerUser || 5)) {
            throw new Error(`Maximum device limit reached (${fastifyInstance.jwt.options.maxDevicesPerUser || 5} devices). Please log out from other devices.`);
        }

        // Inserta el nuevo token
        await db.run(
            `INSERT INTO refresh_tokens 
             (token, user_id, expires_at, device_info, revoked) 
             VALUES (?, ?, ?, ?, 0)`,
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

/**
 * Marca un token JWT (por su JTI) como revocado en la base de datos.
 * @param {string} jti - El JWT ID del token a revocar.
 * @param {object} db - La instancia de la base de datos SQLite.
 * @returns {Promise<void>}
 * @throws {Error} Si falta el JTI o la instancia de DB.
 */
export const revokeToken = async (jti, db) => {
    if (!jti) {
        throw new Error('JTI is required to revoke token');
    }
    if (!db) {
        throw new Error('Database instance is required to revoke token');
    }

    try {
        // Insertamos el JTI en la tabla de tokens revocados
        await db.run(
            `INSERT INTO revoked_tokens (jti, expires_at) 
             VALUES (?, datetime('now', '+1 hour'))`, // Se revoca por 1 hora para tokens de acceso
            [jti]
        );
        console.log(`Token revoked: ${jti}`);
    } catch (error) {
        console.error('Error revoking token:', error);
        throw error;
    }
};

/**
 * Verifica la validez de un token JWT y chequea si ha sido revocado.
 * @param {string} token - El token JWT a verificar.
 * @param {import('fastify').FastifyInstance} fastifyInstance - La instancia de Fastify.
 * @param {object} db - La instancia de la base de datos SQLite (para la verificación de revocación).
 * @returns {Promise<object>} Los datos decodificados del token.
 * @throws {Error} Si el token es inválido, ha expirado, está revocado o faltan dependencias.
 */
export const verifyToken = async (token, fastifyInstance, db) => {
    if (!token || typeof token !== 'string') {
        throw new Error('Invalid token format');
    }
    if (!fastifyInstance || !fastifyInstance.jwt) {
        throw new Error('Fastify instance with JWT plugin is required to verify token');
    }
    if (!db) {
        throw new Error('Database instance is required to verify token for revocation check');
    }

    try {
        // Usar fastifyInstance.jwt.verify para decodificar y validar la firma/expiración
        const decoded = fastifyInstance.jwt.verify(token, {
            algorithms: [fastifyInstance.jwt.options.algorithm],
            issuer: fastifyInstance.jwt.options.issuer,
            audience: fastifyInstance.jwt.options.audience,
            clockTolerance: fastifyInstance.jwt.options.clockTolerance
        });

        // Verificar si el token (por su JTI) está revocado
        if (decoded.jti) {
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
        } else {
            console.warn('JWT without JTI detected, cannot check for explicit revocation.');
        }

        return decoded;
    } catch (err) {
        // Mejorar el manejo de errores para respuestas HTTP consistentes
        if (err.name === 'TokenExpiredError') {
            err.statusCode = 401;
            err.code = 'TOKEN_EXPIRED';
        } else if (err.name === 'JsonWebTokenError') {
            err.statusCode = 403; // Error general de JWT (malformado, firma inválida, etc.)
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

/**
 * Verifica la validez de un token temporal JWT para propósitos específicos (ej. 2FA).
 * @param {string} token - El token temporal a verificar.
 * @param {import('fastify').FastifyInstance} fastifyInstance - La instancia de Fastify.
 * @returns {object} Los datos decodificados del token.
 * @throws {Error} Si el token es inválido, no tiene el propósito correcto o falta el userId.
 */
export const verifyTempToken = (token, fastifyInstance) => {
    if (!fastifyInstance || !fastifyInstance.jwt) {
        throw new Error('Fastify instance with JWT plugin is required to verify temp token');
    }
    try {
        // Usar fastifyInstance.jwt.verify
        const decoded = fastifyInstance.jwt.verify(token, {
            algorithms: [fastifyInstance.jwt.options.algorithm],
            issuer: fastifyInstance.jwt.options.issuer,
            audience: fastifyInstance.jwt.options.audience,
            clockTolerance: fastifyInstance.jwt.options.clockTolerance
        });
        
        console.log('Token temporal decodificado:', {
            decoded,
            expectedPurpose: config.tempTokenPurpose // Usar la configuración local de auth.js
        });

        if (decoded.purpose !== config.tempTokenPurpose) {
            throw new Error(`Invalid token purpose. Expected: ${config.tempTokenPurpose}`);
        }

        if (!decoded.userId) {
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

// NOTA: authMiddleware fue eliminado de este archivo porque su lógica debe estar directamente
// en el preHandler de cada ruta protegida para integrar correctamente con Fastify.
// Ejemplo: preHandler: async (request, reply) => { try { await request.jwtVerify(); } catch (err) { ... } }
