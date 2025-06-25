import crypto from 'crypto'; 

// Creamos el router de Fastify (usando el plugin system)
export async function gameRoutes(fastify, options) {
    // Accede a la instancia de la base de datos a través de fastify.db
    const db = fastify.db; 

    // Helper para enviar errores
    const sendError = (reply, status, message, details = {}) => {
        console.error(`GameRoutes Error [${status}]:`, message, details);
        return reply.status(status).send({ status: 'error', message: message, ...details });
    };

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
                                    winner_id: { type: 'string' }, 
                                    loser_id: { type: 'string' },  
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
            },
            tags: ['game'],
            security: [
                {
                    bearerAuth: [],
                },
            ],
        },
        preHandler: async (request, reply) => { // ¡Correcto! Usar preHandler directamente con request.jwtVerify()
            try {
                await request.jwtVerify();
            } catch (err) {
                reply.status(401).send({ status: 'error', message: 'No autorizado o token inválido' });
                throw err; 
            }
        }
    }, async (request, reply) =>{
        const userId = parseInt(request.params.id);

        if (isNaN(userId)){
            return sendError(reply, 400, 'ID de usuario inválido');
        }

        const query = `
            SELECT * FROM games
            WHERE winner_id = ? OR loser_id = ?
            ORDER BY created_at DESC
        `;

        try {
            const rows = await db.all(query, [userId, userId]);
            reply.code(200).send({status: 'ok', games: rows});
        } catch (err) {
            console.error('Error al consultar la base de datos para partidas:', err.message);
            sendError(reply, 500, 'Error interno del servidor al obtener partidas', { details: err.message });
        }
    });

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
                winner_id: { type: 'string' }, 
                loser_id: { type: 'string' },
                tournament: { type: 'boolean', default: false },
                score_winner: { type: 'integer', default: 0 },
                score_loser: { type: 'integer', default: 0 },
                exp_winner: { type: 'integer', default: 0 },
                exp_loser: { type: 'integer', default: 0 },
                game_duration: { type: 'integer', nullable: true } 
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
            },
            500: {
                type: 'object',
                properties: {
                    status: { type: 'string' },
                    message: { type: 'string' },
                    details: { type: 'string', nullable: true }
                }
            }
            },
            tags: ['game'],
            security: [
                {
                    bearerAuth: [],
                },
            ],
        },
        preHandler: async (request, reply) => { // ¡Correcto! Usar preHandler directamente con request.jwtVerify()
            try {
                await request.jwtVerify();
            } catch (err) {
                reply.status(401).send({ status: 'error', message: 'No autorizado o token inválido' });
                throw err; 
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
        } = request.body;

        const query = `
            INSERT INTO games (
                winner_id, loser_id, tournament, score_winner,
                score_loser, exp_winner, exp_loser, game_duration
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        try {
            const result = await db.run(
                query,
                [winner_id, loser_id, tournament, score_winner, score_loser, exp_winner, exp_loser, game_duration]
            );
            reply.code(201).send({ status: 'ok', message: 'Partida creada', game_id: result.lastID });
        } catch (err) {
            console.error('Error al crear partida:', err.message);
            sendError(reply, 500, 'Error al guardar la partida', { details: err.message });
        }
    });


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
            properties: {
                winner_id: { type: 'string', nullable: true }, 
                loser_id: { type: 'string', nullable: true },  
                tournament: { type: 'boolean', nullable: true },
                score_winner: { type: 'integer', nullable: true },
                score_loser: { type: 'integer', nullable: true },
                exp_winner: { type: 'integer', nullable: true },
                exp_loser: { type: 'integer', nullable: true },
                game_duration: { type: 'integer', nullable: true }
            },
            minProperties: 1 
            },
            response: {
            200: {
                type: 'object',
                properties: {
                status: { type: 'string' },
                message: { type: 'string' }
                }
            },
            400: { type: 'object', properties: { status: { type: 'string' }, message: { type: 'string' } } },
            404: { type: 'object', properties: { status: { type: 'string' }, message: { type: 'string' } } },
            500: { type: 'object', properties: { status: { type: 'string' }, message: { type: 'string' }, details: { type: 'string', nullable: true } } }
            },
            tags: ['game'],
            security: [
                {
                bearerAuth: [],
                },
            ],
        },
        preHandler: async (request, reply) => { // ¡Correcto! Usar preHandler directamente con request.jwtVerify()
            try {
                await request.jwtVerify();
            } catch (err) {
                reply.status(401).send({ status: 'error', message: 'No autorizado o token inválido' });
                throw err; 
            }
        }
    }, async (request, reply) => {
        const gameId = parseInt(request.params.id);
        const updates = request.body; 

        if (isNaN(gameId)) {
            return sendError(reply, 400, 'ID de juego inválido');
        }
        if (Object.keys(updates).length === 0) {
            return sendError(reply, 400, 'No se proporcionaron datos para actualizar.');
        }

        try {
            const setClauses = [];
            const params = [];
            for (const key in updates) {
                if (updates[key] !== undefined) { 
                    setClauses.push(`${key} = ?`);
                    params.push(updates[key]);
                }
            }
            
            if (setClauses.length === 0) {
                return sendError(reply, 400, 'No se proporcionaron campos válidos para actualizar.');
            }

            setClauses.push('updated_at = CURRENT_TIMESTAMP'); 
            
            params.push(gameId); 

            const query = `UPDATE games SET ${setClauses.join(', ')} WHERE id = ?`;
            const result = await db.run(query, params);

            if (result.changes === 0) {
                return sendError(reply, 404, 'Partida no encontrada o sin cambios para actualizar.');
            }

            reply.send({ status: 'ok', message: 'Partida actualizada' });
        } catch (err) {
            console.error('Error al actualizar partida:', err.message);
            sendError(reply, 500, 'Error al actualizar la partida', { details: err.message });
        }
    });


    /*| Método | Ruta               | Descripción                                       |
        | ------ | ------------------ | --------------------------------------------------|
        | GET    | /games/users       | Partidas en las que participó un usuario          |*/
    fastify.get('/games/users', { 
        schema: {
            summary: 'Obtener partidas de un usuario autenticado',
            description: 'Devuelve todas las partidas en las que el usuario autenticado ha participado.',
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
                                    winner_id: { type: 'string' },
                                    loser_id: { type: 'string' },
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
                401: { type: 'object', properties: { status: { type: 'string' }, message: { type: 'string' } } },
                500: { type: 'object', properties: { status: { type: 'string' }, message: { type: 'string' } } }
            },
            tags: ['game'],
            security: [
                {
                    bearerAuth: [], 
                },
            ],
        },
        preHandler: async (request, reply) => { // ¡Correcto! Usar preHandler directamente con request.jwtVerify()
            try {
                await request.jwtVerify();
            } catch (err) {
                reply.status(401).send({ status: 'error', message: 'No autorizado o token inválido' });
                throw err; 
            }
        }
    },async (request, reply) => {
        const userId = request.user.id; 

        const query = `
            SELECT * FROM games
            WHERE winner_id = ? OR loser_id = ?
            ORDER BY created_at DESC
        `;

        try {
            const rows = await db.all(query, [userId, userId]);
            reply.send({ status: 'ok', games: rows });
        } catch (err) {
            console.error('Error al obtener partidas del usuario autenticado:', err.message);
            sendError(reply, 500, 'Error interno del servidor al obtener partidas del usuario', { details: err.message });
        }
    });

    // DELETE /games/:id
    fastify.delete('/games/:id', {
        schema: {
            description: 'Elimina una partida por su ID.',
            tags: ['Game'],
            params: {
                type: 'object',
                required: ['id'],
                properties: {
                    id: { type: 'integer', description: 'ID de la partida a eliminar' }
                }
            },
            response: {
                200: { type: 'object', properties: { success: { type: 'boolean' }, message: { type: 'string' } } },
                404: { type: 'object', properties: { error: { type: 'string' } } },
                500: { type: 'object', properties: { error: { type: 'string' } } },
            }
        },
        preHandler: async (request, reply) => { // ¡Correcto! Usar preHandler directamente con request.jwtVerify()
            try {
                await request.jwtVerify();
            } catch (err) {
                reply.status(401).send({ status: 'error', message: 'No autorizado o token inválido' });
                throw err; 
            }
        }
    }, async (request, reply) => {
        const { id } = request.params;
        try {
            const result = await db.run('DELETE FROM games WHERE id = ?', [id]);
            
            if (result.changes === 0) {
                return sendError(reply, 404, 'Partida no encontrada para eliminar.');
            }

            reply.send({ success: true, message: 'Partida eliminada correctamente.' });
        } catch (err) {
            console.error(`Error al eliminar partida con ID ${id}:`, err.message);
            sendError(reply, 500, 'Error al eliminar partida', { details: err.message });
        }
    });
}
