/**
 * Archivo con todas las rutas para el usuario.
 */
const express = require('express');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { sqlite3 } = require('../app');

const router = express.Router();

const dbPath = path.join(__dirname, 'data', 'sqlite.db');
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
const initSQL = fs.readFileSync(path.join(__dirname, 'tools', 'init.sql'), 'utf-8');
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
router.post('/api/regiter', async(req, res) => {
    const { username, email, paswword } = req.body;

    if (!username || !email || !password) {
        return res.status(400).send('Faltan campos requeridos');
    }

    try {
        const hashedPasword = await brcrypt.hash(password, 10); // await es esperar a que la 'promesa' del brcrypt se resuelva.

        const query = 'INSERT INTO users (username, email, pasword) VALUES (?, ?, ?)'
        db.run(query, [username, email, hashedPasword], function (err) {
            if (err) {
                console.error('Error al registrar el usuario: ', err.message);
                return res.status(500).json({error: 'Error al registrar el usuario'});
            }
            res.status(201).json({ message: 'Usuario registrado exitosamente', id: this.lastID });
        });
    } catch (error) {
        console.error('Error al registrar eñ usuario: ', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * @brief Routa para mostrar todos los usuarios de la base de datos.
 * @return Devuelve los usuario en formato json.
 */
app.get('/api/users', (req, res) => {
    db.all('SELECT * FROM users', [], (err, rows) => {
        if (err) {
            console.error('Error al consultar la tabla users:', err.message);
            res.status(500).send('Error al consultar la tabla users');
            return;
        }
        res.json(rows);
    });
});