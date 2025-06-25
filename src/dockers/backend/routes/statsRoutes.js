// Creamos el router de Fastify (usando el plugin system)
export async function statsRoutes(fastify, options) {
    // Accede a la instancia de la base de datos a través de fastify.db
    const db = fastify.db; 

    // Helper para enviar errores
    const sendError = (reply, status, message, details = {}) => {
        console.error(`StatsRoutes Error [${status}]:`, message, details);
        return reply.status(status).send({ status: 'error', message: message, ...details });
    };

    fastify.get('/stats/user/games', {
        schema: {
            summary: 'Estadísticas de partidas por usuario autenticado',
            description: 'Devuelve un resumen de partidas ganadas/perdidas y un histórico de puntuación por día para el usuario autenticado.',
            tags: ['Stats'],
            security: [
                {
                    bearerAuth: [], 
                },
            ],
            response: {
                200: {
                    type: 'object',
                    properties: {
                        summary: {
                            type: 'object',
                            properties: {
                                username: { type: 'string' },
                                games_won: { type: 'integer' },
                                total_score_won: { type: 'integer' },
                                total_score_lost: { type: 'integer' },
                                total_games: { type: 'integer' },
                            },
                            nullable: true 
                        },
                        scoreByDate: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    date: { type: 'string', format: 'date-time' },
                                    totalScore: { type: 'integer' },
                                    totalWon: { type: 'integer' },
                                }
                            }
                        }
                    }
                },
                401: { type: 'object', properties: { status: { type: 'string' }, message: { type: 'string' } } },
                500: { type: 'object', properties: { status: { type: 'string' }, message: { type: 'string' } } }
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
        const userId = request.user.id; 

        try {
            const querySummary = `
                SELECT 
                    username,
                    SUM(CASE WHEN role = 'winner' THEN 1 ELSE 0 END) AS games_won,
                    SUM(CASE WHEN role = 'winner' THEN score ELSE 0 END) AS total_score_won,
                    SUM(CASE WHEN role = 'loser' THEN score ELSE 0 END) AS total_score_lost,
                    COUNT(*) AS total_games
                FROM (
                    SELECT winner_id AS username, 'winner' AS role, score_winner AS score FROM games WHERE winner_id = ?
                    UNION ALL
                    SELECT loser_id AS username, 'loser' AS role, score_loser AS score FROM games WHERE loser_id = ?
                ) AS all_players
                GROUP BY username;
            `;
            const userSummary = await db.get(querySummary, [userId, userId]);

            const queryScoreWonPerDay = `
                SELECT 
                    strftime('%Y-%m-%d %H:%M', created_at) AS date_time,
                    SUM(CASE WHEN role = 'winner' THEN 1 ELSE 0 END) AS games_won,
                    SUM(score) AS total_score
                FROM (
                    SELECT winner_id AS username, 'winner' AS role, score_winner AS score, created_at FROM games WHERE winner_id = ?
                    UNION ALL
                    SELECT loser_id AS username, 'loser' AS role, score_loser AS score, created_at FROM games WHERE loser_id = ?
                ) AS all_players
                GROUP BY date_time
                ORDER BY date_time;
            `;

            const scoreRows = await db.all(queryScoreWonPerDay, [userId, userId]);
            
            const scoreByDate = scoreRows.map(row => ({
                date: row.date_time,
                totalScore: row.total_score,
                totalWon: row.games_won
            }));

            reply.send({
                summary: userSummary || { username: null, games_won: 0, total_score_won: 0, total_score_lost: 0, total_games: 0 },
                scoreByDate: scoreByDate
            });

        } catch (err) {
            console.error('Error al obtener estadísticas del usuario:', err.message, err.stack);
            sendError(reply, 500, 'Error interno del servidor al obtener estadísticas', { details: err.message });
        }
    });

    // TODO: Add other stats-related routes here if needed
}
