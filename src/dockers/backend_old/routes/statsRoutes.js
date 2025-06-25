import fs from "fs";
import path from "path";
import sqlite3Module from "sqlite3";
import { dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sqlite3 = sqlite3Module.verbose();

export async function statsRoutes(fastify, options) {
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
    fastify.get('/stats/user/games',async (request, reply) => {
        const decoded = await request.jwtVerify();

        const userId = decoded.user
        const query = `
			SELECT 
				username,
				SUM(CASE WHEN role = 'winner' THEN 1 ELSE 0 END) AS games_won,
				SUM(CASE WHEN role = 'winner' THEN score ELSE 0 END) AS total_score_won,
				SUM(CASE WHEN role = 'loser' THEN score ELSE 0 END) AS total_score_lost,
				COUNT(*) AS total_games
			FROM (
				SELECT winner_id AS username, 'winner' AS role, score_winner AS score FROM games
				UNION ALL
				SELECT loser_id AS username, 'loser' AS role, score_loser AS score FROM games
			) AS all_players
			WHERE username = ? 
			GROUP BY username;
        `
			const listScoreWonPerDay = `
				SELECT 
					strftime('%Y-%m-%d %H:%M', created_at) AS date_time,
					SUM(CASE WHEN role = 'winner' THEN 1 ELSE 0 END) AS games_won,
					SUM(score) AS total_score
				FROM (
					SELECT winner_id AS username, 'winner' AS role, score_winner AS score, created_at FROM games
					UNION ALL
					SELECT loser_id AS username, 'loser' AS role, score_loser AS score, created_at FROM games
				) AS all_players
				WHERE username = ?
				GROUP BY date_time
				ORDER BY date_time;
			`;




        return new Promise((resolve, reject) => {
            db.get(query, [userId], (err, userRow) => {
                if (err) {
					console.error('Error al obtener partidas del usuario:', err.message);
					reply.code(500).send({ status: 'error', message: 'Error interno del servidor' });
                    return reject(err)
                }

				db.all(listScoreWonPerDay, [userId], (err, scoreRows) => {
					if (err) {
						console.error('Error al obtener puntuación por día:', err.message);
						reply.code(500).send({ status: 'error', message: 'Error interno del servidor' });
						return;
					}
					const scoreByDate = scoreRows.map(row => ({
						date: row.date_time,
						totalScore: row.total_score,
							totalWon: row.games_won
					}));


						reply.send({
							summary: userRow,
							scoreByDate
						});
						resolve()

		
				});
          
            })
        })
    })
}