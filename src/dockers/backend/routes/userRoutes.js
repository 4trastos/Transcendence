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
 * @brief Ruta para registrar usuarios en la base de datos (NICO).
 */
/* router.post('/register', async(req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).send('Faltan campos requeridos');
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10); // await es esperar a que la 'promesa' del brcrypt se resuelva.

        const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
        db.run(query, [username, email, hashedPassword], function (err) {
            if (err) {
                console.error('Error al registrar el usuario: ', err.message);
                return res.status(500).json({error: 'Error al registrar el usuario'});
            }
            res.status(201).json({ message: 'Usuario registrado exitosamente', id: this.lastID });
        });
    } catch (error) {
        console.error('Error al registrar el usuario: ', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
}); */

/**
 * @brief Ruta para registrar usuarios en la base de datos (NUEVA).
 */
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

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

                // Insertar nuevo usuario
                db.run(
                    `INSERT INTO users 
                    (username, email, password, verification_token) 
                    VALUES (?, ?, ?, ?)`,
                    [username, email, hashedPassword, verificationToken],
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
 * @brief Loguea al usuario (NICO)
 */
/* router.post('/login', async(req, res) =>{
    const { username, password, guestMode } = req.body;

    if (guestMode) {
        console.log("Accediendo como invitado");
            res.status(200).json({ message: "Inicio de sesión como invitado exitoso" });

        return;
    }

    if (typeof username !== "string" || typeof password !== "string" || username.trim() === "" || password.trim() === "") {
        return res.status(400).send('Faltan campos requeridos');
    }

    try {
        const query = 'SELECT password FROM users WHERE username = ?';
        db.get(query, [username], async (err, row) =>{
            if (err){
                console.error("Error en la base de datos:", err);
                return res.status(500).json({ error: "Error al buscar el usuario" });
            }
            if (!row) {
                return res.status(404).send('Usuario no encontrado');
            }
            const isMatch = await bcrypt.compare(password, row.password);
            if (isMatch){              
                res.status(200).json({ message: 'Inicio de sesión exitoso', id: row.id });

                return;
            } else{
                console.log("Contraseña incorrecta");
                return res.status(400).send('Contraseña incorrecta');
            }
        });
    } catch (error) {
        res.status(500).json({ error : 'Error interno del servidor'});
    }
}); */

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
                    expiresAt.setHours(expiresAt.getHours() + 24); // 24 horas de sesión

                    db.run(
                        `INSERT INTO user_sessions 
                        (user_id, session_token, expires_at) 
                        VALUES (?, ?, ?)`,
                        [this.lastID, sessionToken, expiresAt.toISOString()],
                        (err) => {
                            if (err) {
                                console.error('Error al crear sesión:', err);
                                return res.status(500).json({ error: 'Error al crear sesión' });
                            }

                            // Registrar log
                            db.run(
                                'INSERT INTO security_logs (user_id, action_type, status) VALUES (?, ?, ?)',
                                [this.lastID, 'guest_login', 'success'],
                                (err) => {
                                    if (err) console.error('Error en log:', err);
                                    
                                    res.status(200).json({ 
                                        message: 'Sesión de invitado creada',
                                        sessionToken,
                                        userId: this.lastID
                                    });
                                }
                            );
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
        // Buscar usuario incluyendo estado de verificación
        db.get(
            'SELECT id, password, is_verified FROM users WHERE username = ?', 
            [username], 
            async (err, user) => {
                if (err) {
                    console.error("Error en la base de datos:", err);
                    return res.status(500).json({ error: "Error al buscar el usuario" });
                }

                if (!user) {
                    // Registrar intento fallido en logs
                    db.run(
                        'INSERT INTO security_logs (action_type, status, details) VALUES (?, ?, ?)',
                        ['login_attempt', 'failed', `Usuario no encontrado: ${username}`],
                        (err) => {
                            if (err) console.error('Error en log:', err);
                        }
                    );
                    return res.status(404).json({ error: 'Usuario no encontrado' });
                }

                // Verificar contraseña
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    // Registrar intento fallido
                    db.run(
                        'INSERT INTO security_logs (user_id, action_type, status) VALUES (?, ?, ?)',
                        [user.id, 'login_attempt', 'failed'],
                        (err) => {
                            if (err) console.error('Error en log:', err);
                        }
                    );
                    return res.status(401).json({ error: 'Credenciales inválidas' });
                }

                // Verificar si el usuario está verificado
                if (!user.is_verified) {
                    return res.status(403).json({ 
                        error: 'Cuenta no verificada', 
                        needsVerification: true 
                    });
                }

                // Crear nueva sesión
                const sessionToken = crypto.randomBytes(64).toString('hex');
                const expiresAt = new Date();
                expiresAt.setHours(expiresAt.getHours() + 24); // 24 horas de sesión

                db.run(
                    `INSERT INTO user_sessions 
                    (user_id, session_token, expires_at, ip_address, user_agent) 
                    VALUES (?, ?, ?, ?, ?)`,
                    [user.id, sessionToken, expiresAt.toISOString(), req.ip, req.get('User-Agent')],
                    (err) => {
                        if (err) {
                            console.error('Error al crear sesión:', err);
                            return res.status(500).json({ error: 'Error al iniciar sesión' });
                        }

                        // Actualizar último login
                        db.run(
                            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
                            [user.id],
                            (err) => {
                                if (err) console.error('Error al actualizar last_login:', err);
                            }
                        );

                        // Registrar login exitoso
                        db.run(
                            'INSERT INTO security_logs (user_id, action_type, status) VALUES (?, ?, ?)',
                            [user.id, 'login', 'success'],
                            (err) => {
                                if (err) console.error('Error en log:', err);
                                
                                res.status(200).json({ 
                                    message: 'Inicio de sesión exitoso', 
                                    sessionToken,
                                    userId: user.id
                                });
                            }
                        );
                    }
                );
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

module.exports = router;