const express = require('express');
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

router.post('/gameResult', async(req, res) => {
    const {Player1, Player2} = req.body;

    if (Player1 == "3"){
        if (req.session.player1){
            const username = req.session.users[0].username;
            console.log(`¡${username} ganó el partido con 3 puntos!`);

            return res.status(200).json({
                message: `¡Felicidades ${username}, ganaste el partido!`
            });
        }
    } else {
        if (req.session.player2) {
            const username = req.session.users[1].username;
            console.log(`¡${username} (Jugador 2) ganó el partido con 3 puntos!`);
            return res.status(200).json({
                message: `¡Felicidades ${username}, ganaste el partido como Jugador 2!`
            });
        } else {
            return res.status(401).json({
                message: "Jugador 2 no tiene sesión activa."
            });
        }
    }
});

module.exports = router;