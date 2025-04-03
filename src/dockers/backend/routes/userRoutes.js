/**
 * Archivo con todas las rutas para el usuario.
 */
const express = require('express');
const session = require("express-session");
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { console } = require('inspector');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const jwt = require('jsonwebtoken'); 
const { generateAccessToken, generateRefreshToken, middleware: authMiddleware } = require('../auth'); // Importa el nuevo módulo
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const router = express.Router();
const verificationToken = crypto.randomBytes(32).toString('hex');

const dbPath = path.join(__dirname, '..', 'data', 'sqlite.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite');
    }
});

/**
 * Ejecutar el script de inicialización de la base de datos desde tools/init.sql
 */
const initSQL = fs.readFileSync(path.join(__dirname, '..', 'tools', 'init.sql'), 'utf-8');
db.exec(initSQL, (err) => {
    if (err) {
        console.error('Error al inicializar la base de datos:', err.message);
    } else {
        console.log('Base de datos inicializada correctamente');
    }
});

/**
 * @brief Ruta para registrar usuarios en la base de datos (NUEVA).
 */
router.post('/register', async (req, res) => {
    const { username, email, password, enable2FA } = req.body;

    // Validación básica
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Validación de formato de email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Formato de email inválido' });
    }

    // Validación de fortaleza de contraseña
    if (password.length < 8) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    try {
        // Verificar si el usuario o email ya existen
        db.get('SELECT id FROM users WHERE username = ? OR email = ?', 
            [username, email], 
            async (err, row) => {
                if (err) {
                    console.error('Error al verificar usuario existente:', err.message);
                    return res.status(500).json({ error: 'Error al registrar el usuario' });
                }
                
                if (row) {
                    return res.status(409).json({ error: 'El usuario o email ya están registrados' });
                }

                // Hash de la contraseña
                const hashedPassword = await bcrypt.hash(password, 12);
                const verificationToken = crypto.randomBytes(32).toString('hex');
                
                // Configuración de 2FA
                let twoFactorSecret = null;
                if (enable2FA) {
                    const secret = speakeasy.generateSecret({ length: 20 });
                    twoFactorSecret = secret.base32;
                    console.log(`2FA Secret for ${email}: ${twoFactorSecret}`);
                }

                // Insertar nuevo usuario
                db.run(
                    `INSERT INTO users 
                    (username, email, password, verification_token, two_factor_secret, two_factor_enabled) 
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [username, email, hashedPassword, verificationToken, 
                     twoFactorSecret, enable2FA ? 1 : 0],
                    function(err) {
                        if (err) {
                            console.error('Error al registrar el usuario:', err.message);
                            return res.status(500).json({ error: 'Error al registrar el usuario' });
                        }

                        // Crear perfil vacío
                        db.run(
                            'INSERT INTO user_profiles (user_id) VALUES (?)',
                            [this.lastID],
                            (err) => {
                                if (err) {
                                    console.error('Error al crear perfil:', err.message);
                                    // No fallamos aquí, solo lo registramos
                                }

                                // Registrar en logs de seguridad
                                db.run(
                                    `INSERT INTO security_logs 
                                    (user_id, action_type, status) 
                                    VALUES (?, ?, ?)`,
                                    [this.lastID, 'register', 'success'],
                                    (err) => {
                                        if (err) {
                                            console.error('Error en log de seguridad:', err);
                                        }

                                        // Enviar email de verificación (simulado)
                                        console.log(`Token de verificación para ${email}: ${verificationToken}`);
                                        
                                        res.status(201).json({ 
                                            message: 'Usuario registrado exitosamente', 
                                            userId: this.lastID 
                                        });
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

/**
 * @brief Loguea al usuario (NUEVA)
 */
router.post('/login', async (req, res) => {
    const { username, password, guestMode } = req.body;

    if (guestMode) {
        // Crear usuario invitado
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

                    // Crear sesión
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

                            // Generar JWT para el usuario invitado
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

    // Validación para login normal
    if (typeof username !== "string" || typeof password !== "string" || 
        username.trim() === "" || password.trim() === "") {
        return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    try {
        db.get(
            'SELECT id, password, is_verified, two_factor_secret, two_factor_enabled FROM users WHERE username = ?', 
            [username], 
            async (err, user) => {
                if (err) {
                    console.error("Error en la base de datos:", err);
                    return res.status(500).json({ error: "Error al buscar el usuario" });
                }

                if (!user) {
                    db.run(
                        'INSERT INTO security_logs (action_type, status, details) VALUES (?, ?, ?)',
                        ['login_attempt', 'failed', `Usuario no encontrado: ${username}`],
                        (err) => { if (err) console.error('Error en log:', err); }
                    );
                    return res.status(404).json({ error: 'Usuario no encontrado' });
                }

                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    db.run(
                        'INSERT INTO security_logs (user_id, action_type, status) VALUES (?, ?, ?)',
                        [user.id, 'login_attempt', 'failed'],
                        (err) => { if (err) console.error('Error en log:', err); }
                    );
                    return res.status(401).json({ error: 'Credenciales inválidas' });
                }

                if (!user.is_verified) {
                    return res.status(403).json({ 
                        error: 'Cuenta no verificada', 
                        needsVerification: true 
                    });
                }

                if (user.two_factor_enabled && user.two_factor_secret) {
                    const tempToken = crypto.randomBytes(32).toString('hex');
                    
                    // Guardar token temporal en la base de datos
                    await db.run(
                        'INSERT INTO two_fa_tokens (user_id, token, expires_at) VALUES (?, ?, datetime("now", "+15 minutes"))',
                        [user.id, tempToken]
                    );

                    return res.status(202).json({
                        requires2FA: true,
                        tempToken: tempToken, // Asegurar que se envía el token
                        userId: user.id,
                        message: 'Se requiere verificación 2FA' // Mensaje claro
                    });
                }

                // Generar tokens
                const accessToken = generateAccessToken({ 
                    id: user.id,
                    role: user.role
                });
                const refreshToken = await generateRefreshToken(user.id);

                // En la respuesta de login exitoso:
                res.cookie('refreshToken', refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
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

/**
 * @brief Routa para mostrar todos los usuarios de la base de datos.
 * @return Devuelve los usuario en formato json.
 */
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

// Nuevo endpoint para refresh
router.post('/refresh-token', async (req, res) => {
    const { refreshToken } = req.body;
    
    // 1. Verificar refresh token en BD
    const tokenRecord = await db.get(
        `SELECT user_id FROM refresh_tokens 
         WHERE token = ? AND expires_at > ? AND revoked = 0`,
        [refreshToken, new Date()]
    );

    if (!tokenRecord) {
        return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // 2. Generar nuevos tokens
    const accessToken = generateAccessToken({ id: tokenRecord.user_id });
    const newRefreshToken = await generateRefreshToken(tokenRecord.user_id);

    // 3. Revocar el antiguo
    await db.run(
        `UPDATE refresh_tokens SET revoked = 1 WHERE token = ?`,
        [refreshToken]
    );

    res.json({ 
        accessToken, 
        refreshToken: newRefreshToken 
    });
});

// Nuevo endpoint para logout
router.post('/logout', authMiddleware, async (req, res) => {
    await db.run(
        `INSERT INTO revoked_tokens (jti, user_id) VALUES (?, ?)`,
        [req.user.jti, req.user.sub]
    );
    res.json({ message: 'Logged out successfully' });
});

/**
 * Endpoint para validar tokens
 */
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

// Endpoint para iniciar 2FA
router.post('/setup-2fa', authMiddleware, async (req, res) => {
    const { userId } = req.user;
    const secret = speakeasy.generateSecret({ length: 20 });
    
    await db.run(
        'UPDATE users SET two_factor_secret = ?, two_factor_enabled = 0 WHERE id = ?',
        [secret.base32, userId]
    );
    
    res.json({
        qrCode: await QRCode.toDataURL(secret.otpauth_url),
        secret: secret.base32
    });
});

// Endpoint para verificar 2FA
router.post('/verify-2fa', async (req, res) => {
    const { userId, code, tempToken } = req.body;
    
    // Verificar token temporal
    const tokenRecord = await db.get(
        'SELECT * FROM two_fa_tokens WHERE user_id = ? AND token = ? AND expires_at > datetime("now")',
        [userId, tempToken]
    );
    
    if (!tokenRecord) {
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
    
    // Verificar código 2FA
    const user = await db.get(
        'SELECT two_factor_secret FROM users WHERE id = ?',
        [userId]
    );
    
    const verified = speakeasy.totp.verify({
        secret: user.two_factor_secret,
        encoding: 'base32',
        token: code,
        window: 1
    });
    
    if (!verified) {
        return res.status(401).json({ error: 'Código 2FA inválido' });
    }
    
    // Generar tokens finales
    const accessToken = generateAccessToken({ id: userId });
    const refreshToken = await generateRefreshToken(userId);
    
    // Limpiar token temporal
    await db.run('DELETE FROM two_fa_tokens WHERE token = ?', [tempToken]);
    
    res.json({ accessToken, refreshToken });
});

// Endpoint para re-enviar el código de 2FA
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

        // Generar un nuevo código (opcional)
        // const newCode = speakeasy.totp({
        //     secret: user.two_factor_secret,
        //     encoding: 'base32'
        // });
        
        // Enviar el mismo código (o el nuevo) al usuario (simulado)
        console.log(`Nuevo código 2FA para ${username}: (simulado)`);

        res.json({ message: 'Código 2FA reenviado' });
    } catch (error) {
        console.error('Error al re-enviar el código 2FA:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;