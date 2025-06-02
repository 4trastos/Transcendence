const fastify = require('fastify');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

const { config, verifyTempToken, generateAccessToken, generateRefreshToken, middleware: authMiddleware } = require('../auth');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const emailService = require('../emailService');


// Creamos el router de Fastify (usando el plugin system)
async function userRoutes(fastify, options) {
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const dbPath = path.join(__dirname, '..', 'data', 'sqlite.db');
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error al conectar a la base de datos:', err.message);
        } else {
            console.log('Conectado a la base de datos SQLite');
            db.serialize(); // <--- Añadido serialize() aquí
        }
    });

    const initSQL = fs.readFileSync(path.join(__dirname, '..', 'tools', 'init.sql'), 'utf-8');
    db.exec(initSQL, (err) => {
        if (err) {
            console.error('Error al inicializar la base de datos:', err.message);
        } else {
            console.log('Base de datos inicializada correctamente');
        }
    });


   // POST /login (Fastify - versión corregida)
    fastify.post('/login',{
  schema: {
    description: 'Iniciar sesión con usuario y contraseña o como invitado. Soporta 2FA.',
    tags: ['Auth'],
    body: {
      type: 'object',
      properties: {
        username: { type: 'string' },
        password: { type: 'string' },
        guestMode: { type: 'boolean' }
      },
      required: [],
      oneOf: [
        {
          required: ['guestMode']
        },
        {
          required: ['username', 'password']
        }
      ]
    },
    response: {
      200: {
        description: 'Inicio de sesión exitoso',
        type: 'object',
        properties: {
          success: { type: 'boolean', nullable: true },
          token: { type: 'string', nullable: true },
          userId: { type: 'integer', nullable: true },
          username: { type: 'string', nullable: true },
          email: { type: 'string', nullable: true },
          requires2FA: { type: 'boolean', nullable: true },
          tempToken: { type: 'string', nullable: true },
          message: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      },
      400: {
        description: 'Credenciales inválidas',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: { type: 'string' },
          details: { type: 'string' }
        }
      },
      401: {
        description: 'Contraseña incorrecta',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: { type: 'string' },
          details: { type: 'string' }
        }
      },
      403: {
        description: 'Cuenta no verificada',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: { type: 'string' },
          needsVerification: { type: 'boolean' },
          solution: { type: 'string' }
        }
      },
      404: {
        description: 'Usuario no encontrado',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: { type: 'string' },
          solution: { type: 'string' }
        }
      },
      500: {
        description: 'Error interno del servidor',
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          error: { type: 'string' },
          message: { type: 'string', nullable: true }
        }
      }
    },
  }
}, async (request, reply) => {
        const { username, password, guestMode } = request.body;

        const sendError = (status, error, details = {}) => {
            const response = { success: false, error, ...details };
            console.error(`Login error [${status}]:`, response);
            return reply.status(status).send(response);
        };

        try {
            if (guestMode) {
                return handleGuestLogin(request, reply);
            }

            if (!username?.trim() || !password?.trim()) {
                return sendError(400, 'Credenciales inválidas', {
                    details: 'Username y password son requeridos'
                });
            }

            const user = await new Promise((resolve, reject) => {
                db.get(
                    'SELECT id, username, email, password, is_verified, two_factor_secret, two_factor_enabled FROM users WHERE username = ?',
                    [username.trim()],
                    (err, row) => {
                        if (err) {
                            console.error("Error en la consulta SQL:", {
                                error: err,
                                query: 'SELECT password FROM users WHERE username = ?',
                                params: [username.trim()]
                            });
                            reject(err);
                        } else {
                            resolve(row);
                        }
                    }
                );
            });

            if (!user) {
                return sendError(404, 'Usuario no encontrado', {
                    solution: 'Verifique el username o regístrese'
                });
            }

            console.log("Datos para comparación:", {
                inputPassword: password,
                dbPassword: user.password ? `[hash de ${user.password.length} caracteres]` : 'NULL'
            });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return sendError(401, 'Credenciales inválidas', {
                    details: 'La contraseña es incorrecta'
                });
            }

            if (!user.is_verified) {
                return sendError(403, 'Cuenta no verificada', {
                    needsVerification: true,
                    solution: 'Verifique su email o contacte al administrador'
                });
            }

            // Flujo 2FA - Versión corregida
            if (user.two_factor_enabled && user.two_factor_secret) {
                //const { config } = require('../auth'); 
                const tempToken = jwt.sign(
                    {
                        userId: user.id, // Asegurar que sea userId (no user.id)
                        purpose: config.tempTokenPurpose, // Usar la constante de configuración
                        aud: config.audience,
                        iss: config.issuer,
                        iat: Math.floor(Date.now() / 1000),
                        exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutos
                    },
                    config.secret,
                    { algorithm: config.algorithm }
                );

                console.log('Token 2FA generado para usuario:', {
                    userId: user.id,
                    username: user.username,
                    tempToken: tempToken,
                    twoFactorSecret: user.two_factor_secret
                });
        
                return reply.send({
                    requires2FA: true,
                    tempToken,
                    userId: user.id, // Enviar userId explícitamente
                    username: user.username,
                    email: user.email,
                    message: 'Se requiere verificación 2FA',
                    timestamp: new Date().toISOString()
                });
            }

            return handleStandardLogin(user, reply);
        } catch (error) {
            console.error('Error completo en proceso de login:', {
                error: error.message,
                stack: error.stack,
                requestBody: request.body
            });
            return sendError(500, 'Error interno del servidor', {
                message: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    });
    
    // Funciones auxiliares separadas
    async function handleGuestLogin(request, reply) {
        try {
        const guestUsername = `guest_${crypto.randomBytes(8).toString('hex')}`;
        const guestEmail = `${guestUsername}@example.com`;
    
        const result = await db.run(
            'INSERT INTO users (username, email, password, is_active) VALUES (?, ?, ?, ?)',
            [guestUsername, guestEmail, 'guest_password', 1]
        );
    
        const sessionToken = crypto.randomBytes(64).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
        await db.run(
            'INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)',
            [result.lastID, sessionToken, expiresAt.toISOString()]
        );
    
        const accessToken = generateAccessToken({
            id: result.lastID,
            role: 'guest'
        });
    
        return reply.send({
            success: true,
            message: 'Login successful',
            accessToken,
            user: {
            id: result.lastID,
            username: guestUsername,
            email: guestEmail,
            role: 'guest'
            }
        });
        } catch (error) {
        console.error('Error en login de invitado:', error);
        throw error;
        }
    }
    
    async function handle2FALogin(user, reply) {
        const tempToken = jwt.sign(
        {
            userId: user.id,
            purpose: '2fa_verification',
            aud: 'pong-client',
            iss: 'pong-app.com'
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
        );
    
        return reply.send({
        success: true,
        requires2FA: true,
        tempToken,
        user: { id: user.id, username: user.username },
        message: 'Se requiere verificación 2FA'
        });
    }
    
    async function handleStandardLogin(user, reply) {
        const accessToken = generateAccessToken({
        id: user.id,
        username: user.username,
        authMethod: 'standard'
        });
    
        const refreshToken = await generateRefreshToken(user.id);
    
        return reply
        .setCookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            path: '/'
        })
        .send({
            success: true,
            accessToken,
            refreshToken,
            userId: user.id,
            username: user.username
        });
  }

    // GET /users
    fastify.get('/users', {
  schema: {
    description: 'Obtiene todos los usuarios registrados en la base de datos.',
    tags: ['Users'],
    response: {
      200: {
        description: 'Lista de usuarios',
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            email: { type: 'string' },
            password: { type: 'string' },
            is_verified: { type: 'boolean' },
            two_factor_enabled: { type: 'boolean' },
            two_factor_secret: { type: 'string', nullable: true }
          }
        }
      },
      500: {
        description: 'Error del servidor al consultar la base de datos',
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  }
}, (request, reply) => {
        db.all('SELECT * FROM users', [], (err, rows) => {
            if (err) {
                console.error('Error al consultar la tabla users:', err.message);
                reply.status(500).send('Error al consultar la tabla users');
                return;
            }
            reply.send(rows);
        });
    });

    // GET /protected-test
    fastify.get('/protected-test', {
  preHandler: [authMiddleware],
  schema: {
    description: 'Ruta de prueba para validar acceso con JWT. Requiere autenticación.',
    tags: ['Auth'],
    security: [
      {
        bearerAuth: []
      }
    ],
    response: {
      200: {
        description: 'Acceso concedido al recurso protegido',
        type: 'object',
        properties: {
          message: { type: 'string' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              username: { type: 'string' },
              email: { type: 'string' }
              // Puedes extender esto según lo que tu JWT incluya
            }
          },
          timestamp: { type: 'string', format: 'date-time' }
        }
      },
      401: {
        description: 'Token inválido o no proporcionado',
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  }
}, (request, reply) => {
        reply.send({ 
            message: 'Acceso concedido', 
            user: request.user,
            timestamp: new Date().toISOString()
        });
    });

    // POST /refresh-token
    fastify.post('/refresh-token', {
  schema: {
    description: 'Genera un nuevo accessToken y refreshToken a partir de un refreshToken válido',
    tags: ['Auth'],
    body: {
      type: 'object',
      required: ['refreshToken'],
      properties: {
        refreshToken: { type: 'string', description: 'Refresh token válido no expirado ni revocado' }
      }
    },
    response: {
      200: {
        description: 'Tokens generados correctamente',
        type: 'object',
        properties: {
          accessToken: { type: 'string', description: 'Nuevo token JWT de acceso' },
          refreshToken: { type: 'string', description: 'Nuevo refresh token persistido' }
        }
      },
      401: {
        description: 'Refresh token inválido, expirado o revocado',
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  }
},  async (request, reply) => {
        const { refreshToken } = request.body;
        
        const tokenRecord = await db.get(
            `SELECT user_id FROM refresh_tokens 
             WHERE token = ? AND expires_at > ? AND revoked = 0`,
            [refreshToken, new Date()]
        );

        if (!tokenRecord) {
            return reply.status(401).send({ error: 'Invalid refresh token' });
        }

        const accessToken = generateAccessToken({ id: tokenRecord.user_id });
        const newRefreshToken = await generateRefreshToken(tokenRecord.user_id);

        await db.run(
            `UPDATE refresh_tokens SET revoked = 1 WHERE token = ?`,
            [refreshToken]
        );

        reply.send({ 
            accessToken, 
            refreshToken: newRefreshToken 
        });
    });

    // POST /logout
    fastify.post('/logout', {
  preHandler: [authMiddleware],
  schema: {
    description: 'Revoca el token JWT actual del usuario autenticado',
    tags: ['Auth'],
    security: [{ bearerAuth: [] }],
    response: {
      200: {
        description: 'Logout exitoso',
        type: 'object',
        properties: {
          message: { type: 'string', example: 'Logged out successfully' }
        }
      },
      401: {
        description: 'No autorizado o token inválido',
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  }
}, async (request, reply) => {
        await db.run(
            `INSERT INTO revoked_tokens (jti, user_id) VALUES (?, ?)`,
            [request.user.jti, request.user.sub]
        );
        reply.send({ message: 'Logged out successfully' });
    });

    // POST /validate-token
    fastify.post('/validate-token', {
  schema: {
    description: 'Valida un token JWT y devuelve su estado y datos decodificados',
    tags: ['Auth'],
    body: {
      type: 'object',
      required: ['token'],
      properties: {
        token: { type: 'string', description: 'Token JWT a validar' }
      }
    },
    response: {
      200: {
        description: 'Token válido',
        type: 'object',
        properties: {
          valid: { type: 'boolean', example: true },
          decoded: { type: 'object', description: 'Datos decodificados del token' },
          expiresAt: { type: 'string', format: 'date-time', example: '2025-06-02T12:00:00.000Z' }
        }
      },
      400: {
        description: 'Falta el token en el cuerpo',
        type: 'object',
        properties: {
          valid: { type: 'boolean', example: false },
          error: { type: 'string', example: 'Token no proporcionado' }
        }
      },
      401: {
        description: 'Token inválido o expirado',
        type: 'object',
        properties: {
          valid: { type: 'boolean', example: false },
          error: { type: 'string', example: 'jwt expired' }
        }
      }
    }
  }
}, (request, reply) => {
        const { token } = request.body;
        
        if (!token) {
            return reply.status(400).send({ 
                valid: false,
                error: 'Token no proporcionado' 
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET, {
                algorithms: ['HS256'],
                issuer: 'pong-app.com',
                audience: 'pong-client'
            });
            
            reply.send({
                valid: true,
                decoded,
                expiresAt: new Date(decoded.exp * 1000).toISOString()
            });
        } catch (err) {
            reply.status(401).send({
                valid: false,
                error: err.message
            });
        }
    });


    // POST /verify-2fa
    fastify.post('/verify-2fa', {
  schema: {
    description: 'Verifica un código 2FA y un token temporal, y genera nuevos tokens de acceso y refresco.',
    tags: ['Auth'],
    body: {
      type: 'object',
      required: ['code'],
      properties: {
        code: {
          type: 'string',
          description: 'Código 2FA de 6 dígitos generado por la app autenticadora',
          pattern: '^\\d{6}$',
        },
        tempToken: {
          type: 'string',
          description: 'Token temporal enviado en body o en header Authorization',
        }
      }
    },
    headers: {
      type: 'object',
      properties: {
        authorization: {
          type: 'string',
          description: 'Token temporal en formato Bearer',
        }
      }
    },
    response: {
      200: {
        description: 'Autenticación 2FA exitosa',
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'integer', example: 123 },
              username: { type: 'string', example: 'usuario123' }
            }
          },
          message: { type: 'string', example: 'Autenticación 2FA exitosa' }
        }
      },
      400: {
        description: 'Código 2FA inválido',
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Código 2FA inválido - debe ser 6 dígitos' },
          receivedCode: { type: 'string', example: '12345' }
        }
      },
      401: {
        description: 'Token temporal no proporcionado o código 2FA inválido',
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Token temporal no proporcionado' },
          solution: { type: 'string', example: 'Debe incluirse en el body o en el header Authorization' }
        }
      },
      403: {
        description: 'Configuración 2FA inválida o incompleta',
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Configuración 2FA inválida o incompleta' },
          details: { type: 'string', example: 'El usuario no tiene un secreto 2FA válido configurado' }
        }
      },
      500: {
        description: 'Error interno de configuración 2FA',
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Error de configuración 2FA' },
          message: { type: 'string', example: 'El secreto 2FA tiene un formato inválido' }
        }
      }
    }
  }
}, async (request, reply) => {
        const { code, tempToken } = request.body;
        const authHeader = request.headers.authorization;

        console.log('Inicio verificación 2FA:', {
            code,
            tempToken: tempToken ? `${tempToken.substring(0, 15)}...` : 'undefined',
            authHeader: authHeader ? `${authHeader.substring(0, 15)}...` : 'undefined'
        });

        try {
            // Validaciones básicas
            if (!code?.match(/^\d{6}$/)) {
                return reply.status(400).send({ 
                    error: 'Código 2FA inválido - debe ser 6 dígitos',
                    receivedCode: code
                });
            }

            // Obtener token de header o body
            const tokenToVerify = tempToken || (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);
            if (!tokenToVerify) {
                return reply.status(401).send({ 
                    error: 'Token temporal no proporcionado',
                    solution: 'Debe incluirse en el body o en el header Authorization'
                });
            }

            // Verificar token temporal
            console.log('Verificando token temporal...');
            const tokenData = verifyTempToken(tokenToVerify);
            console.log('Token verificado:', {
                userId: tokenData.userId,
                purpose: tokenData.purpose,
                exp: new Date(tokenData.exp * 1000).toISOString()
            });

            // Función para obtener usuario con reintentos
            const getUserWithRetry = async (userId, maxRetries = 3) => {
                let retries = 0;
                while (retries < maxRetries) {
                    try {
                        const user = await new Promise((resolve, reject) => {
                            db.get(`
                                SELECT id, username, two_factor_secret 
                                FROM users 
                                WHERE id = ? 
                                AND two_factor_secret IS NOT NULL
                                AND two_factor_enabled = 1`,
                                [userId],
                                (err, row) => {
                                    if (err) reject(err);
                                    else resolve(row);
                                }
                            );
                        });
                        
                        if (user) return user;
                        
                    } catch (err) {
                        if (err.code === 'SQLITE_BUSY' && retries < maxRetries - 1) {
                            retries++;
                            await new Promise(resolve => setTimeout(resolve, 100 * retries));
                            continue;
                        }
                        throw err;
                    }
                }
                return null;
            };

            // Obtener usuario
            const user = await getUserWithRetry(tokenData.userId);
            if (!user?.two_factor_secret) {
                console.error('Error al recuperar secreto 2FA:', {
                    userId: tokenData.userId,
                    userData: user,
                    time: new Date().toISOString()
                });
                return reply.status(403).send({ 
                    error: 'Configuración 2FA inválida o incompleta',
                    details: 'El usuario no tiene un secreto 2FA válido configurado'
                });
            }

            console.log('Verificando código 2FA para usuario:', {
                userId: user.id,
                username: user.username,
                secretPresent: !!user.two_factor_secret
            });

            console.log('Tiempo del servidor:', {
                serverTime: new Date().toISOString(),
                serverTimestamp: Math.floor(Date.now()/1000),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            });

            // Limpiar y validar el secreto
            const secretToUse = user.two_factor_secret.trim();
            
            if (!secretToUse.match(/^[A-Z2-7]{16,}$/)) {
                console.error('Formato inválido de secreto 2FA:', {
                    secret: user.two_factor_secret,
                    userId: user.id
                });
                return reply.status(500).send({
                    error: 'Error de configuración 2FA',
                    message: 'El secreto 2FA tiene un formato inválido'
                });
            }

            // Verificación TOTP
            const verificationTime = Math.floor(Date.now() / 1000);
            const verified = speakeasy.totp.verify({
                secret: secretToUse,
                encoding: 'base32',
                token: code,
                window: 1,
                step: 30,
                time: verificationTime
            });

            // Depuración detallada
            console.log('Detalles de verificación:', {
                userId: user.id,
                secretUsed: secretToUse,
                codeReceived: code,
                serverTime: new Date(verificationTime * 1000).toISOString(),
                calculatedCodes: {
                    current: speakeasy.totp({
                        secret: secretToUse,
                        encoding: 'base32',
                        time: verificationTime
                    }),
                    previous: speakeasy.totp({
                        secret: secretToUse,
                        encoding: 'base32',
                        time: verificationTime - 30
                    }),
                    next: speakeasy.totp({
                        secret: secretToUse,
                        encoding: 'base32',
                        time: verificationTime + 30
                    })
                }
            });

            if (!verified) {
                console.error('Código 2FA no válido. Códigos esperados:', {
                    current: speakeasy.totp({
                        secret: secretToUse,
                        encoding: 'base32',
                        time: verificationTime
                    }),
                    previous: speakeasy.totp({
                        secret: secretToUse,
                        encoding: 'base32',
                        time: verificationTime - 30
                    }),
                    next: speakeasy.totp({
                        secret: secretToUse,
                        encoding: 'base32',
                        time: verificationTime + 30
                    })
                });
                return reply.status(401).send({ 
                    error: 'Código 2FA inválido',
                    hint: 'Verifica que el código sea el actual y que el reloj esté sincronizado',
                    debug: process.env.NODE_ENV === 'development' ? {
                        currentCode: speakeasy.totp({
                            secret: secretToUse,
                            encoding: 'base32',
                            time: verificationTime
                        }),
                        timeWindow: verificationTime
                    } : undefined
                });
            }

            // Generar tokens finales
            const accessToken = generateAccessToken({
                id: user.id,
                username: user.username,
                two_fa_verified: true,
                auth_method: '2fa'
            }, request);

            const refreshToken = await generateRefreshToken(user.id, request);

            console.log('Autenticación 2FA exitosa para usuario:', user.id);

            return reply.send({
                success: true,
                accessToken,
                refreshToken,
                user: {
                    id: user.id,
                    username: user.username
                },
                message: 'Autenticación 2FA exitosa'
            });

        } catch (error) {
            console.error('Error en verify-2fa:', {
                error: error.message,
                stack: error.stack,
                requestBody: request.body,
                time: new Date().toISOString()
            });

            const statusCode = error.statusCode || 500;
            return reply.status(statusCode).send({ 
                error: 'Error en verificación 2FA',
                message: error.message,
                ...(process.env.NODE_ENV === 'development' && { details: error.stack })
            });
        }
    });

    // POST /resend-2fa
    fastify.post('/resend-2fa', {

  schema: {
        description: 'Verifica un código 2FA y un token temporal, y genera nuevos tokens de acceso y refresco.',
    tags: ['Auth'],

    body: {
      type: 'object',
      required: ['username'],
      properties: {
        username: { type: 'string' }
      }
    }
  }
}, async (request, reply) => {
        const { username } = request.body;
        
        try {
            const user = await db.get(
                'SELECT two_factor_secret FROM users WHERE username = ?',
                [username]
            );
            
            if (!user || !user.two_factor_secret) {
                return reply.status(404).send({ error: 'Usuario o 2FA no configurado' });
            }

            console.log(`Nuevo código 2FA para ${username}: (simulado)`);

            reply.send({ message: 'Código 2FA reenviado' });
        } catch (error) {
            console.error('Error al re-enviar el código 2FA:', error);
            reply.status(500).send({ error: 'Error interno del servidor' });
        }
    });

    // GET /verify-email
    fastify.get('/verify-email',{schema: {
  querystring: {
    type: 'object',
    required: ['token', 'email'],
    properties: {
      token: { type: 'string', minLength: 1, description: 'Token de verificación' },
      email: { type: 'string', format: 'email', description: 'Correo electrónico del usuario' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    },
    400: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  },
  description: 'Verifica el email del usuario con un token',
  tags: ['Auth']
}}, async (request, reply) => {
        const { token, email } = request.query;

        if (!token || !email) {
            return reply.status(400).send({ error: 'Token y email son requeridos' });
        }

        try {
            await new Promise((resolve, reject) => {
                db.run(
                    'UPDATE users SET verified = 1 WHERE email = ? AND verification_token = ?',
                    [email, token],
                    function(err) {
                        if (err) return reject(err);
                        if (this.changes === 0) {
                            return reject(new Error('Token inválido o email incorrecto'));
                        }
                        resolve();
                    }
                );
            });

            reply.send({ success: true, message: 'Email verificado correctamente' });
        } catch (error) {
            console.error('Error al verificar email:', error);
            reply.status(400).send({ error: error.message });
        }
    });

    // GET /check-2fa-status/:userId
    fastify.get('/check-2fa-status/:userId',{schema:{
  params: {
    type: 'object',
    required: ['userId'],
    properties: {
      userId: { type: 'string', pattern: '^[0-9]+$', description: 'ID del usuario (numérico)' }
    }
  },
  response: {
    200: {
      type: 'object',
      properties: {
        has2FA: { type: 'boolean', description: 'Indica si el usuario tiene configurado 2FA' },
        is2FAEnabled: { type: 'boolean', description: 'Indica si el usuario tiene activado 2FA' }
      }
    },
    404: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    },
    500: {
      type: 'object',
      properties: {
        error: { type: 'string' }
      }
    }
  },
  description: 'Consulta el estado de configuración y activación del 2FA de un usuario',
  tags: ['Auth']
}}, async (request, reply) => {
        const { userId } = request.params;
        
        try {
            const user = await db.get(
                `SELECT two_factor_secret, two_factor_enabled 
                 FROM users WHERE id = ?`,
                [userId]
            );
            
            if (!user) {
                return reply.status(404).send({ error: 'Usuario no encontrado' });
            }
            
            reply.send({
                has2FA: !!user.two_factor_secret,
                is2FAEnabled: !!user.two_factor_enabled
            });
        } catch (error) {
            console.error('Error al verificar estado 2FA:', error);
            reply.status(500).send({ error: 'Error interno del servidor' });
        }
    });
}

// Creamos el router de Fastify (usando el plugin system)
async function userRoutes(fastify, options) {
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const dbPath = path.join(__dirname, '..', 'data', 'sqlite.db');
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error al conectar a la base de datos:', err.message);
        } else {
            console.log('Conectado a la base de datos SQLite');
            db.serialize(); // <--- Añadido serialize() aquí
        }
    });

    const initSQL = fs.readFileSync(path.join(__dirname, '..', 'tools', 'init.sql'), 'utf-8');
    db.exec(initSQL, (err) => {
        if (err) {
            console.error('Error al inicializar la base de datos:', err.message);
        } else {
            console.log('Base de datos inicializada correctamente');
        }
    });

    // GET /users
    fastify.get('/users', {
  schema: {
    description: 'Obtiene todos los usuarios registrados en la base de datos.',
    tags: ['Users'],
    response: {
      200: {
        description: 'Lista de usuarios',
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            username: { type: 'string' },
            email: { type: 'string' },
            password: { type: 'string' },
            is_verified: { type: 'boolean' },
            two_factor_enabled: { type: 'boolean' },
            two_factor_secret: { type: 'string', nullable: true }
          }
        }
      },
      500: {
        description: 'Error del servidor al consultar la base de datos',
        type: 'object',
        properties: {
          error: { type: 'string' }
        }
      }
    }
  }
}, (request, reply) => {
        db.all('SELECT * FROM users', [], (err, rows) => {
            if (err) {
                console.error('Error al consultar la tabla users:', err.message);
                reply.status(500).send('Error al consultar la tabla users');
                return;
            }
            reply.send(rows);
        });
    });

}
module.exports = userRoutes;