const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Conectar a la base de datos SQLite
const dbPath = path.join(__dirname, 'data', 'sqlite.db');
const db = new sqlite3.Database(dbPath);

// Ejecutar el script de inicialización de la base de datos desde tools/init.sql
const initSQL = fs.readFileSync(path.join(__dirname, '/tools', 'init.sql'), 'utf-8');
db.exec(initSQL, (err) => {
    if (err) {
        console.error('Error al inicializar la base de datos:', err.message);
    } else {
        console.log('Base de datos inicializada correctamente');
    }
});

// Ruta básica para probar el servidor
app.get('/', (req, res) => {
    res.send('¡Hola, mundo desde Node.js!');
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
