const fastify = require('fastify');
const fs = require('fs');
const { request } = require('http');
const path = require('path');
const { use } = require('react');
const sqlite3 = require('sqlite3').verbose();

async function profileRoutes(fastify, options) {

    const dbPath = path.join(__dirname, '..', 'data', 'sqlite.db')
    const db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error al conectar a la base de datos:', err.message)
        } else {
            console.log('Conectado a la base de datos SQLite')
        }
    })

    /**
     * Ejecutar el script de inicialización de la base de datos desde tools/init.sql
     */
    const initSQL = fs.readFileSync(path.join(__dirname, '..', 'tools', 'init.sql'), 'utf-8')
    db.exec(initSQL, (err) => {
        if (err) {
            console.error('Error al inicializar la base de datos:', err.message)
        } else {
            console.log('Base de datos inicializada correctamente')
        }
    })

    fastify.get('/profile/:id', async (request, reply) => {
        const userId = parseInt(request.params.id)

        if (isNaN(userId)){
            return reply.code(400).send({status: 'error', message: 'ID invalido'})
        }

        const query = `
            SELECT * FROM users
            WHERE id = ?
        `;

        return new Promise((resolve, reject) => {
            db.all(query, [userId], (err, rows) => {
                if (err) {
                    console.error('Error al consultar la base de datos:', err.message)
                    reply.code(500).send({ status: 'error', message: 'Error interno del servidor' })
                    return reject(err)
                }
                //Hacer el dto del profile
                reply.code(200).send({status: 'ok', games: rows})
                resolve()
            })
        })
    })

}

module.exports = profileRoutes;