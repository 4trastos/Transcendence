const fastify = require('fastify');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

async function gameRoutes(fastify, options) {
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

    fastify.post('/gameResult', async(request, reply) => {
        const {Player1, Player2} = request.body;

        if (Player1 == "3"){
            if (request.session.player1){
                const username = request.session.users[0].username;
                console.log(`¡${username} ganó el partido con 3 puntos!`);

                return reply.status(200).send({
                    message: `¡Felicidades ${username}, ganaste el partido!`
                });
            }
        } else {
            if (request.session.player2) {
                const username = request.session.users[1].username;
                console.log(`¡${username} (Jugador 2) ganó el partido con 3 puntos!`);
                return reply.status(200).send({
                    message: `¡Felicidades ${username}, ganaste el partido como Jugador 2!`
                });
            } else {
                return reply.status(401).send({
                    message: "Jugador 2 no tiene sesión activa."
                });
            }
        }
    });
}

module.exports = gameRoutes;