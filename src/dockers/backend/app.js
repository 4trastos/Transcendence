const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const cors = require('cors');  // <-- Importa cors
const axios = require('axios');  // Añadir axios para hacer solicitudes HTTP

const app = express();
const port = 3000;

// Middleware para parsear JSON en solicitudes POST
app.use(express.json());
app.use(cors());  // <-- Habilita CORS para todas las rutas

// Conectar a la base de datos SQLite
const dbPath = path.join(__dirname, 'data', 'sqlite.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite');
    }
});

// Ejecutar el script de inicialización de la base de datos desde tools/init.sql
const initSQL = fs.readFileSync(path.join(__dirname, 'tools', 'init.sql'), 'utf-8');
db.exec(initSQL, (err) => {
    if (err) {
        console.error('Error al inicializar la base de datos:', err.message);
    } else {
        console.log('Base de datos inicializada correctamente');
    }
});

// Ruta de prueba
app.get('/api/test', (req, res) => {
    res.json({ message: '¡Conexión con el backend exitosa!' });
});

// Ruta básica para probar el servidor
app.get('/', (req, res) => {
    res.send('¡Hola, mundo desde Node.js!');
});

// Ruta para obtener todos los usuarios
app.get('/api/users', (req, res) => {
    db.all('SELECT * FROM users', [], (err, rows) => {
        if (err) {
            console.error('Error al consultar la tabla users:', err.message);
            res.status(500).send('Error al consultar la tabla users');
            return;
        }
        // Devuelve los usuarios en formato JSON
        res.json(rows);
    });
});

// Ruta para obtener todos los juegos
app.get('/api/games', (req, res) => {
    db.all('SELECT * FROM games', [], (err, rows) => {
        if (err) {
            console.error('Error al consultar la tabla games:', err.message);
            res.status(500).send('Error al consultar la tabla games');
            return;
        }
        // Devuelve los juegos en formato JSON
        res.json(rows);
    });
});

// Ruta para obtener todos los elementos (items)
app.get('/api/items', (req, res) => {
    db.all('SELECT * FROM items', [], (err, rows) => {
        if (err) {
            console.error('Error al consultar los elementos:', err.message);
            res.status(500).send('Error al consultar los elementos');
            return;
        }
        res.json(rows);
    });
});

// Endpoint para crear un nuevo ítem
app.post('/api/items', (req, res) => {
    const { name, description } = req.body;

    if (!name || !description) {
        return res.status(400).json({ error: 'Name and description are required' });
    }

    const sql = 'INSERT INTO items (name, description) VALUES (?, ?)';
    const params = [name, description];

    db.run(sql, params, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, name, description }); // Devuelve el nuevo ítem con el ID generado
    });
});


// Ruta POST para crear un nuevo usuario
app.post('/api/create', (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).send('Faltan campos requeridos');
    }
    const query = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
    db.run(query, [username, email, password], function (err) {
        if (err) {
            console.error('Error al insertar usuario:', err.message);
            return res.status(500).send('Error al insertar usuario');
        }
        res.status(201).send(`Usuario creado con ID: ${this.lastID}`);
    });
});

// Ruta para probar la conexión a la base de datos con una consulta de prueba
app.get('/api/test_db', (req, res) => {
    db.get('SELECT 1', [], (err, row) => {
        if (err) {
            console.error('Error al hacer la consulta de prueba:', err.message);
            res.status(500).send('Error al hacer la consulta de prueba');
            return;
        }
        // Respuesta de éxito si la consulta de prueba fue correcta
        res.send('Conexión a la base de datos exitosa');
    });
});

// Nueva ruta para obtener el estado de Avalanche
//app.get('/api/avalanche_status', async (req, res) => {
//    try {
//       const response = await axios.get('http://blockchain:9650/ext/health');
//       res.json(response.data);
//    } catch (error) {
//        console.error('Error al obtener el estado de Avalanche:', error.message);
//        res.status(500).send('Error al obtener el estado de Avalanche');
//    }
//});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
