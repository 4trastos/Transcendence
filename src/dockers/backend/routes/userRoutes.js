const express = require('express');
const session = require("express-session");
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { console } = require('inspector');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const jwt = require('jsonwebtoken'); 
const { generateAccessToken, generateRefreshToken, middleware: authMiddleware } = require('../auth');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const emailService = require('../emailService');

const router = express.Router();
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

router.post('/register', async (req, res) => {
    const { username, email, password, enable2FA } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Formato de email inválido' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    try {
        db.get('SELECT id FROM users WHERE username = ? OR email = ?', 
            [username, email], 
            async (err, row) => {
                if (err) {
                    console.error('Error al verificar usuario existente:', err.message);
                    return res.status(500).json({ error: 'Error al registrar el usuario' });
                }
                
                if (row) {
                    console.warn('Intento de registro duplicado para:', email);
                    return res.status(409).json({ error: 'El usuario o email ya están registrados' });
                }

                const hashedPassword = await bcrypt.hash(password, 12);
                const verificationToken = crypto.randomBytes(32).toString('hex');
                
                let twoFactorSecret = null;
                let twoFactorEnabled = 0; // Valor por defecto

                if (enable2FA) {
                    const secret = speakeasy.generateSecret({ length: 20 });
                    twoFactorSecret = secret.base32;
                    twoFactorEnabled = 1; // Habilitar 2FA explícitamente
                    console.log(`2FA Secret for ${email}: ${twoFactorSecret}`);
                }

                db.run(
                    `INSERT INTO users 
                    (username, email, password, verification_token, two_factor_secret, two_factor_enabled) 
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [username, email, hashedPassword, verificationToken, 
                     twoFactorSecret, twoFactorEnabled], // Usar la variable twoFactorEnabled
                    function(err) {
                        if (err) {
                            console.error('Error al registrar el usuario:', err.message);
                            return res.status(500).json({ error: 'Error al registrar el usuario' });
                        }

                        db.run(
                            'INSERT INTO user_profiles (user_id) VALUES (?)',
                            [this.lastID],
                            (err) => {
                                if (err) {
                                    console.error('Error al crear perfil:', err.message);
                                }

                                db.run(
                                    `INSERT INTO security_logs 
                                    (user_id, action_type, status) 
                                    VALUES (?, ?, ?)`,
                                    [this.lastID, 'register', 'success'],
                                    (err) => {
                                        if (err) {
                                            console.error('Error en log de seguridad:', err);
                                        }

                                        // Enviar email de verificación (excepto en entorno de test)
                                        if (process.env.NODE_ENV !== 'test') {
                                            emailService.sendVerificationEmail(email, verificationToken)
                                                .then(sent => {
                                                    if (!sent) {
                                                        console.error('Error: El email de verificación no pudo ser enviado');
                                                    }
                                                })
                                                .catch(emailError => {   
                                                console.error('Error en el servicio de email:', {
                                                    error: emailError.message,
                                                    stack: emailError.stack,
                                                    userId: this.lastID       
                                               });
                                            })
                                        }
    
                                        if (enable2FA) {
                                            const otpauthUrl = speakeasy.otpauthURL({
                                                secret: twoFactorSecret,
                                                label: `Pong:${email}`,
                                                issuer: 'PongApp',
                                                encoding: 'base32',
                                            });
                                            QRCode.toDataURL(otpauthUrl, (err, imageUrl) => {
                                                if (err) {
                                                    console.error('Error al generar el código QR:', err);
                                                    return res.status(500).json({ error: 'Error interno del servidor' });
                                                }
                                                res.status(201).json({
                                                    message: 'Usuario registrado exitosamente',
                                                    user: { id: this.lastID },
                                                    qrCode: imageUrl,
                                                });
                                            });
                                        } else {
                                            res.status(201).json({
                                                message: 'Usuario registrado exitosamente',
                                                user: { id: this.lastID },
                                            });
                                        }
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    } catch (error) {
        console.error('Error en el proceso de registro:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/login', async (req, res) => {
    const { username, password, guestMode } = req.body;

    if (guestMode) {
        const guestUsername = `guest_${Math.random().toString(36).substring(2, 10)}`;
        const guestEmail = `${guestUsername}@example.com`;
        
        try {
            db.run(
                'INSERT INTO users (username, email, password, is_active) VALUES (?, ?, ?, ?)',
                [guestUsername, guestEmail, 'guest_password', 1],
                function(err) {
                    if (err) {
                        console.error('Error al crear usuario invitado:', err);
                        return res.status(500).json({ error: 'Error al crear sesión de invitado' });
                    }

                    const sessionToken = crypto.randomBytes(64).toString('hex');
                    const expiresAt = new Date();
                    expiresAt.setHours(expiresAt.getHours() + 24);

                    db.run(
                        `INSERT INTO user_sessions (user_id, session_token, expires_at) VALUES (?, ?, ?)`,
                        [this.lastID, sessionToken, expiresAt.toISOString()],
                        (err) => {
                            if (err) {
                                console.error('Error al crear sesión:', err);
                                return res.status(500).json({ error: 'Error al crear sesión' });
                            }

                            const accessToken = generateAccessToken({
                                id: this.lastID,
                                role: 'guest'
                            });

                            res.json({
                                message: 'Login successful',
                                accessToken,
                                user: {
                                    id: this.lastID,
                                    username: guestUsername,
                                    email: guestEmail,
                                    role: 'guest'
                                }
                            });
                        }
                    );
                }
            );
        } catch (error) {
            console.error('Error en login de invitado:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
        return;
    }

    // Validación mejorada
    if (typeof username !== "string" || username.trim() === "" ||
        typeof password !== "string" || password.trim() === "") {
        return res.status(400).json({ 
            error: 'Credenciales inválidas',
            details: 'Username y password son requeridos'
        });
    }

    try {
        db.get(
            'SELECT id, username, password, is_verified, two_factor_secret, two_factor_enabled FROM users WHERE username = ?',
            [username.trim()], 
            async (err, user) => {
                if (err) {
                    console.error("Error en la base de datos:", err);
                    return res.status(500).json({ 
                        error: "Error al buscar el usuario",
                        details: process.env.NODE_ENV === 'development' ? err.message : undefined
                    });
                }

                if (!user) {
                    return res.status(404).json({ 
                        error: 'Usuario no encontrado',
                        solution: 'Verifique el username o registrese'
                    });
                }

                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    return res.status(401).json({ 
                        error: 'Credenciales inválidas',
                        details: 'La contraseña es incorrecta'
                    });
                }

                if (!user.is_verified) {
                    return res.status(403).json({ 
                        error: 'Cuenta no verificada', 
                        needsVerification: true,
                        solution: 'Verifique su email o contacte al administrador'
                    });
                }

                // Flujo 2FA
                if (user.two_factor_enabled && user.two_factor_secret) {
                    const tempToken = jwt.sign(
                        { 
                            userId: user.id,
                            purpose: '2fa_verification',
                            aud: 'pong-client',
                            iss: 'pong-app.com'
                        },
                        process.env.JWT_SECRET,
                        { expiresIn: '15m' } // 15 minutos de validez
                    );
                
                    return res.status(202).json({
                        requires2FA: true,
                        tempToken,
                        user: { id: user.id, username: user.username }, // Más datos del usuario
                        message: 'Se requiere verificación 2FA con Google Authenticator'
                    });
                }

                // Flujo sin 2FA
                const accessToken = generateAccessToken({ 
                    id: user.id,
                    username: user.username,
                    authMethod: 'standard'
                });

                const refreshToken = await generateRefreshToken(user.id);

                res.cookie('refreshToken', refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 7 * 24 * 60 * 60 * 1000
                }).json({
                    accessToken,
                    user: {
                        id: user.id,
                        username: user.username
                    }
                });
            }
        );
    } catch (error) {
        console.error('Error en proceso de login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.get('/users', (req, res) => {
    db.all('SELECT * FROM users', [], (err, rows) => {
        if (err) {
            console.error('Error al consultar la tabla users:', err.message);
            res.status(500).send('Error al consultar la tabla users');
            return;
        }
        res.json(rows);
    });
});

router.get('/protected-test', authMiddleware, (req, res) => {
    res.json({ 
        message: 'Acceso concedido', 
        user: req.user,
        timestamp: new Date().toISOString()
    });
});

router.post('/refresh-token', async (req, res) => {
    const { refreshToken } = req.body;
    
    const tokenRecord = await db.get(
        `SELECT user_id FROM refresh_tokens 
         WHERE token = ? AND expires_at > ? AND revoked = 0`,
        [refreshToken, new Date()]
    );

    if (!tokenRecord) {
        return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const accessToken = generateAccessToken({ id: tokenRecord.user_id });
    const newRefreshToken = await generateRefreshToken(tokenRecord.user_id);

    await db.run(
        `UPDATE refresh_tokens SET revoked = 1 WHERE token = ?`,
        [refreshToken]
    );

    res.json({ 
        accessToken, 
        refreshToken: newRefreshToken 
    });
});

router.post('/logout', authMiddleware, async (req, res) => {
    await db.run(
        `INSERT INTO revoked_tokens (jti, user_id) VALUES (?, ?)`,
        [req.user.jti, req.user.sub]
    );
    res.json({ message: 'Logged out successfully' });
});

router.post('/validate-token', (req, res) => {
    const { token } = req.body;
    
    if (!token) {
        return res.status(400).json({ 
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
        
        res.json({
            valid: true,
            decoded,
            expiresAt: new Date(decoded.exp * 1000).toISOString()
        });
    } catch (err) {
        res.status(401).json({
            valid: false,
            error: err.message
        });
    }
});


// POST /verify-2fa
router.post('/verify-2fa', async (req, res) => {
    const { code, userId: rawUserId, tempToken: bodyToken } = req.body;
    const authHeader = req.headers.authorization;

    // Validaciones básicas
    if (!code?.match(/^\d{6}$/)) {
        return res.status(400).json({ error: 'Código 2FA inválido' });
    }

    const userId = parseInt(rawUserId);
    if (isNaN(userId)) {
        return res.status(400).json({ error: 'ID de usuario inválido' });
    }

    const tokenToVerify = bodyToken || (authHeader?.startsWith("Bearer ") && authHeader.split(' ')[1]);
    if (!tokenToVerify) {
        return res.status(401).json({ error: 'Token no proporcionado' });
    }

    let dbConnection;
    try {
        // Inicio de transacción segura
        dbConnection = await new Promise((resolve, reject) => {
            db.run('BEGIN TRANSACTION', [], function(err) {
                if (err) reject(err);
                else resolve(this);
            });
        });

        // Verificación del token
        const tokenData = require('../auth').verifyTempToken(tokenToVerify);
        if (tokenData.userId !== userId) {
            throw new Error('ID de usuario no coincide');
        }

        // Obtener secreto 2FA
        const user = await new Promise((resolve, reject) => {
            db.get(
                'SELECT two_factor_secret FROM users WHERE id = ? AND two_factor_secret IS NOT NULL',
                [userId],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });

        if (!user) {
            throw new Error('2FA no configurado');
        }

        // Verificación del código
        const verified = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'base32',
            token: code,
            window: 2,
            step: 30
        });

        if (!verified) {
            await new Promise((resolve, reject) => {
                db.run('ROLLBACK', [], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            return res.status(401).json({ error: 'Código 2FA inválido' });
        }

        // Generar tokens
        const accessToken = generateAccessToken({ 
            id: userId,
            auth_method: '2fa',
            two_fa_verified: true
        });

        const refreshToken = await generateRefreshToken(userId);

        await new Promise((resolve, reject) => {
            db.run('COMMIT', [], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });

        return res.json({ accessToken, refreshToken, userId });

    } catch (error) {
        if (dbConnection) {
            try {
                await new Promise((resolve, reject) => {
                    db.run('ROLLBACK', [], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            } catch (rollbackError) {
                console.error('Error en ROLLBACK:', rollbackError);
            }
        }

        console.error('Error en verify-2fa:', {
            error: error.message,
            userId,
            code,
            time: new Date().toISOString()
        });

        return res.status(500).json({ 
            error: 'Error en verificación 2FA',
            ...(process.env.NODE_ENV === 'development' && { details: error.message })
        });
    }
});

router.post('/resend-2fa', async (req, res) => {
    const { username } = req.body;
    
    try {
        const user = await db.get(
            'SELECT two_factor_secret FROM users WHERE username = ?',
            [username]
        );
        
        if (!user || !user.two_factor_secret) {
            return res.status(404).json({ error: 'Usuario o 2FA no configurado' });
        }

        console.log(`Nuevo código 2FA para ${username}: (simulado)`);

        res.json({ message: 'Código 2FA reenviado' });
    } catch (error) {
        console.error('Error al re-enviar el código 2FA:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Endpoint para verificar email
router.get('/verify-email', async (req, res) => {
    const { token, email } = req.query;

    if (!token || !email) {
        return res.status(400).json({ error: 'Token y email son requeridos' });
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

        res.json({ success: true, message: 'Email verificado correctamente' });
    } catch (error) {
        console.error('Error al verificar email:', error);
        res.status(400).json({ error: error.message });
    }
});

router.get('/check-2fa-status/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        const user = await db.get(
            `SELECT two_factor_secret, two_factor_enabled 
             FROM users WHERE id = ?`,
            [userId]
        );
        
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json({
            has2FA: !!user.two_factor_secret,
            is2FAEnabled: !!user.two_factor_enabled
        });
    } catch (error) {
        console.error('Error al verificar estado 2FA:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;