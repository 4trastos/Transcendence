/**
 * Archivo con todas las rutas para el usuario.
 */
const express = require('express');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { console } = require('inspector');
const sqlite3 = require('sqlite3').verbose();

const router = express.Router();

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
 * @brief Ruta para registrar usuarios en la base de datos.
 */
router.post('/register', async(req, res) => {
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
});

router.post('/login', async(req, res) =>{
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Faltan campos requeridos');
    }

    try {
        const query = 'SELECT password FROM users WHERE username = ?';
        db.get(query, [username], async (err, row) =>{
            if (err){
                console.error(err);
                return;
            }
            const isMatch = await bcrypt.compare(password, row.password);
            if (isMatch){
                console.log("Contraseña correcta");
                return res.status(200).send('Inicio de sesión exitoso');
            } else{
                console.log("Contraseña incorrecta");
                return res.status(400).send('Contraseña incorrecta');
            }
        });
    } catch (error) {
        res.status(500).json({ error : 'Error interno del servidor'});
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
