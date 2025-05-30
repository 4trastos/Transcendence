const fastify = require('fastify');
const fs = require('fs');
const { request } = require('http');
const path = require('path');
const { use } = require('react');
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

      /*| Método | Ruta               | Descripción                                       |
        | ------ | ------------------ | --------------------------------------------------|
        | GET    | /games/:id         | Detalle de las partidas de un jugador (Historico) |*/
    fastify.get('/game/:id', {
        schema: {
            summary: 'Obtener partidas de un jugador',
            description: 'Devuelve todas las partidas donde el usuario haya participado como ganador o perdedor',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer', description: 'ID del usuario' }
                },
                required: ['id']
            },
            response: {
                200: {
                    description: 'Lista de partidas del jugador',
                    type: 'object',
                    properties: {
                        status: { type: 'string', example: 'ok' },
                        games: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'integer' },
                                    winner_id: { type: 'integer' },
                                    loser_id: { type: 'integer' },
                                    tournament: { type: 'boolean' },
                                    score_winner: { type: 'integer' },
                                    score_loser: { type: 'integer' },
                                    exp_winner: { type: 'integer' },
                                    exp_loser: { type: 'integer' },
                                    game_duration: { type: 'integer' },
                                    created_at: { type: 'string', format: 'date-time' },
                                    updated_at: { type: 'string', format: 'date-time', nullable: true }
                                }
                            }
                        }
                    }
                },
                400: {
                    description: 'ID inválido',
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        message: { type: 'string' }
                    }
                },
                500: {
                    description: 'Error del servidor',
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            }
        }
    }, async (request, reply) =>{
        const userId = parseInt(request.params.id)

        if (isNaN(userId)){
            return reply.code(400).send({status: 'error', message: 'ID invalido'})
        }

        const query = `
            SELECT * FROM games
            WHERE winner_id = ? OR loser_id = ?
            ORDER BY created_at DESC
        `;

        return new Promise((resolve, reject) => {
            db.all(query, [userId, userId], (err, rows) => {
                if (err) {
                    console.error('Error al consultar la base de datos:', err.message)
                    reply.code(500).send({ status: 'error', message: 'Error interno del servidor' })
                    return reject(err)
                }

                reply.code(200).send({status: 'ok', games: rows})
                resolve()
            })
        })
    })

    /*| Método | Ruta               | Descripción                                       |
        | ------ | ------------------ | --------------------------------------------------|
        | POST   | /games             | Crear nueva partida                               |*/
    fastify.post('/games', {
        schema: {
            summary: 'Crear nueva partida',
            body: {
            type: 'object',
            required: ['winner_id', 'loser_id'],
            properties: {
                winner_id: { type: 'integer' },
                loser_id: { type: 'integer' },
                tournament: { type: 'boolean' },
                score_winner: { type: 'integer' },
                score_loser: { type: 'integer' },
                exp_winner: { type: 'integer' },
                exp_loser: { type: 'integer' },
                game_duration: { type: 'integer' }
            }
            },
            response: {
            201: {
                type: 'object',
                properties: {
                status: { type: 'string' },
                message: { type: 'string' },
                game_id: { type: 'integer' }
                }
            }
            }
        }
    },async (request, reply) => {
        const {
            winner_id,
            loser_id,
            tournament = false,
            score_winner = 0,
            score_loser = 0,
            exp_winner = 0,
            exp_loser = 0,
            game_duration = null
        } = request.body

        const query = `
            INSERT INTO games (
                winner_id, loser_id, tournament, score_winner,
                score_loser, exp_winner, exp_loser, game_duration
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `

        return new Promise((resolve, reject) => {
            db.run(
                query,
                [winner_id, loser_id, tournament, score_winner, score_loser, exp_winner, exp_loser, game_duration],
                function (err) {
                    if (err) {
                        console.error('Error al crear partida:', err.message)
                        reply.code(500).send({ status: 'error', message: 'Error al guardar la partida' })
                        return reject(err)
                    }
                    reply.code(201).send({ status: 'ok', message: 'Partida creada', game_id: this.lastID })
                    resolve()
                }
            )
        })
    })


    /*| Método | Ruta               | Descripción                                       |
        | ------ | ------------------ | --------------------------------------------------|
        | PUT    | /games/:id         | Editar partida (ej: asignar ganador)              |*/
    fastify.put('/games/:id', {
        schema: {
            summary: 'Editar partida por ID',
            description: 'Facilita actualizar los datos de la partida una vez creada',
            params: {
            type: 'object',
            properties: {
                id: { type: 'integer' }
            },
            required: ['id']
            },
            body: {
            type: 'object',
            required: ['winner_id', 'loser_id'],
            properties: {
                winner_id: { type: 'integer' },
                loser_id: { type: 'integer' },
                tournament: { type: 'boolean' },
                score_winner: { type: 'integer' },
                score_loser: { type: 'integer' },
                exp_winner: { type: 'integer' },
                exp_loser: { type: 'integer' },
                game_duration: { type: 'integer' }
            }
            },
            response: {
            200: {
                type: 'object',
                properties: {
                status: { type: 'string' },
                message: { type: 'string' }
                }
            }
            }
        }
    }, async (request, reply) => {
        const gameId = parseInt(request.params.id)
        const {
            winner_id,
            loser_id,
            tournament,
            score_winner,
            score_loser,
            exp_winner,
            exp_loser,
            game_duration
        } = request.body

        const query = `
            UPDATE games
            SET
                winner_id = ?,
                loser_id = ?,
                tournament = ?,
                score_winner = ?,
                score_loser = ?,
                exp_winner = ?,
                exp_loser = ?,
                game_duration = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `

        return new Promise((resolve, reject) => {
            db.run(
                query,
                [winner_id, loser_id, tournament, score_winner, score_loser, exp_winner, exp_loser, game_duration, gameId],
                function (err) {
                    if (err) {
                        console.error('Error al actualizar partida:', err.message)
                        reply.code(500).send({ status: 'error', message: 'Error al actualizar la partida' })
                        return reject(err)
                    }

                    reply.send({ status: 'ok', message: 'Partida actualizada' })
                    resolve()
                }
            )
        })
    })


    /*| Método | Ruta               | Descripción                                       |
        | ------ | ------------------ | --------------------------------------------------|
        | GET    | /users/:id/games   | Partidas en las que participó un usuario          |*/
    fastify.get('/users/:id/games', {
        schema: {
            summary: 'Obtener partidas de un usuario',
            params: {
                type: 'object',
                properties: {
                    id: { type: 'integer' }
                },
                required: ['id']
            },
            response: {
                200: {
                    type: 'object',
                    properties: {
                        status: { type: 'string' },
                        games: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'integer' },
                                    winner_id: { type: 'integer' },
                                    loser_id: { type: 'integer' },
                                    tournament: { type: 'boolean' },
                                    score_winner: { type: 'integer' },
                                    score_loser: { type: 'integer' },
                                    exp_winner: { type: 'integer' },
                                    exp_loser: { type: 'integer' },
                                    game_duration: { type: 'integer' },
                                    created_at: { type: 'string' },
                                    updated_at: { type: 'string', nullable: true }
                                }
                            }
                        }
                    }
                }
            }
        }
    },async (request, reply) => {
        const userId = parseInt(request.params.id)

        if (isNaN(userId)) {
            return reply.code(400).send({ status: 'error', message: 'ID inválido' })
        }

        const query = `
            SELECT * FROM games
            WHERE winner_id = ? OR loser_id = ?
            ORDER BY created_at DESC
        `

        return new Promise((resolve, reject) => {
            db.all(query, [userId, userId], (err, rows) => {
                if (err) {
                    console.error('Error al obtener partidas del usuario:', err.message)
                    reply.code(500).send({ status: 'error', message: 'Error interno del servidor' })
                    return reject(err)
                }

                reply.send({ status: 'ok', games: rows })
                resolve()
            })
        })
    })

}

module.exports = gameRoutes;