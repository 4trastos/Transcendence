import VerifyConnection from "../../application/use-cases/VerifyConnection";
import CloseSession from "../../application/use-cases/CloseSession";
import { v4 as uuidv4 } from 'uuid';
import { User } from "../../domain/entities/User";

export class GameWebSocketController {
	private closeSession: CloseSession;
	private matchmakingQueue = []; // Sockets esperando partida
	private matches = new Map();  // matchId -> { jugadores: Set, estado }
	private verifyConnection: VerifyConnection;
	JUGADORES_POR_PARTIDA = 2;

	private canvas = { height: 400, width: 800 };

	constructor(closeSession: CloseSession, verifyConnection: VerifyConnection) {
		this.closeSession = closeSession;
		this.verifyConnection = verifyConnection;
	}

	movePaddles(partida: any) {
		partida.player1.y += partida.player1.dy;
		partida.player2.y += partida.player2.dy;

		partida.player1.y = Math.max(0, Math.min(this.canvas!.height - partida.player1.height, partida.player1.y));
		partida.player2.y = Math.max(0, Math.min(this.canvas!.height - partida.player2.height, partida.player2.y));
	}

	moveBall(partida: any) {
		partida.ball.x += partida.ball.dx;
		partida.ball.y += partida.ball.dy;

		if (partida.ball.y - partida.ball.radius < 0 || partida.ball.y + partida.ball.radius > this.canvas!.height) {
			partida.ball.dy = -partida.ball.dy;
		}

		if (
			partida.ball.x - partida.ball.radius < partida.player1.x + partida.player1.width &&
			partida.ball.y > partida.player1.y && partida.ball.y < partida.player1.y + partida.player1.height && partida.player1CanHit
		) {
			partida.ball.dy > 0 ? partida.ball.dx++ : partida.ball.dy--;
			partida.player1.dy > 0 ? partida.ball.dx++ : partida.player1.dx < 0 ? partida.ball.dy-- : partida.ball.dy = partida.ball.dy;
			partida.ball.dx = -partida.ball.dx;
			partida.player1CanHit = false;
			partida.player2CanHit = true;
		}

		if (
			partida.ball.x + partida.ball.radius > partida.player2.x &&
			partida.ball.y > partida.player2.y && partida.ball.y < partida.player2.y + partida.player2.height && partida.player2CanHit
		) {
			partida.ball.dx > 0 ? partida.ball.dx++ : partida.ball.dy--;
			partida.player2.dy > 0 ? partida.ball.dx++ : partida.player2.dx < 0 ? partida.ball.dy-- : partida.ball.dy = partida.ball.dy;
			partida.ball.dx = -partida.ball.dx;
			partida.player1CanHit = true;
			partida.player2CanHit = false;
		}

		// Score
		if (partida.ball.x - partida.ball.radius < 0) {
			partida.player2Score++;
			//TODO: Enviar notificacion de actualizacion de movimiento y Score
			//partida.updateScore();
			this.resetBall(partida);
		} else if (partida.ball.x + partida.ball.radius > this.canvas!.width) {
			partida.player1Score++;
			//partida.updateScore();
			this.resetBall(partida);
		}
	}

	resetBall(partida: any) {
		partida.ball.x = this.canvas!.width / 2;
		partida.ball.y = this.canvas!.height / 2;
		partida.ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
		partida.ball.dy = 0
		partida.player1CanHit = true;
		partida.player2CanHit = true;
	}


	async saveGame(partida: any, jwt: any) {
		const losser = partida.players?.findLast((item: any) => item !== partida.winner);
		const body = {
			winner_id: partida.winner,
			loser_id: losser,
			tournament: true,
			score_winner: 0,
			score_loser: 0,
			exp_winner: 0,
			exp_loser: 0,
			game_duration: 0
		};
		const response = await fetch(
			"/backend/api/games",
			{
				method: "POST",
				headers: {
					"Accept": "application/json",
					"Content-Type": "application/json",
					Cookie: `token=${jwt}`,
				},
				body: JSON.stringify(body),

				credentials: "include", // Incluir cookies en la solicitud
			}
		);
		if (response.ok) {

		}
	}

	async matchMaking(connection: any, req: any) {
		try {

			//Verifico que el usuario esta registrado antes de conectarse
			const user:User = await this.verifyConnection.execute(connection, req, this.onStatusChange.bind(this));

			
			console.log('Jugador en matchmaking...');
			this.matchmakingQueue.push({ connection: connection, userId: user.username });

			// Escucha cierre de conexión
			connection.on('close', () => {
				const i = this.matchmakingQueue.findIndex(item => item.connection === connection);
				if (i !== -1) this.matchmakingQueue.splice(i, 1);
			});

			//Hacer que el usuario solo espere un cierto tiempo sino muera.
			// Verifica si hay suficientes para crear partida
			if (this.matchmakingQueue.length >= this.JUGADORES_POR_PARTIDA) {
				const jugadores = this.matchmakingQueue.splice(0, this.JUGADORES_POR_PARTIDA);
				const matchId = uuidv4();

				const paddleWidth = 15, paddleHeight = 100, ballSize = 10;

				this.matches.set(matchId, {
					jugadores: new Set(),
					estado: {},
					player1Score: 0,
					player2Score: 0,
					player1CanHit: true,
					player2CanHit: true,
					idPlayer1: jugadores[0].userId,
					idPlayer2: jugadores[1].userId,
					player1: { x: 0, y: this.canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, color: "white", dy: 0 },
					player2: { x: this.canvas.width - paddleWidth, y: this.canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, color: "white", dy: 0 },
					ball: { x: this.canvas.width / 2, y: this.canvas.height / 2, radius: ballSize, speed: 4, dx: 4, dy: 0, color: "white" },
				});

				console.log(`✅ Nueva partida creada: ${matchId}`);

				// Notifica a los jugadores que deben conectarse a la partida
				jugadores.forEach(({ connection, userId }) => {
					if (connection.readyState === 1) {
						connection.send(JSON.stringify({
							type: 'match_found',
							matchId,
							userId
						}));
					}
				});
			}
		} catch (error) {
			console.error("Error en la conexión WebSocket:", error);
			connection.send(JSON.stringify({ error: "Error al intentar emparejar" }));
			connection.close();
		}
	}



	async handleMatch(connection: any, req: any) {
		try {
			const { matchId } = req.params;
			const jwt = req.cokkies.token;

			//this.verifyConnection.execute(connection, req, this.onStatusChange.bind(this));
			const partida = this.matches.get(matchId);
			if (!partida) {
				connection.close();
				return;
			}
			this.matches.set(matchId, partida);
			partida.jugadores.add(connection);

			partida.jugadores.forEach((jugadorSocket) => {
				if (jugadorSocket.readyState === 1) {
					jugadorSocket.send(JSON.stringify({ type: 'init' }));
				}
			});

			partida.intervalId = setInterval(() => {
				this.moveBall(partida);
				this.movePaddles(partida);

				const payload = {
					status: 'started',
					ball: { x: partida.ball.x, y: partida.ball.y },
					player1: partida.player1, // Puedes reemplazar esto con posiciones reales
					player2: partida.player2,
					player1Score: partida.player1Score,
					player2Score: partida.player2Score,
					winner: '',
				};

				if (payload.player2Score >= 3 || payload.player1Score >= 3) {
					if (payload.player1Score >= 3)
						payload.winner = payload.player1;
					else if (payload.player2Score >= 3)
						payload.winner = payload.player2;
					payload.status = 'finished',
					this.saveGame(payload, jwt);
					//TODO: Finalizo la sesion para este jugador.
					partida.jugadores.delete(connection);
					if (partida.jugadores.size === 0) {
						clearInterval(partida.intervalId); // Detener game loop
						this.matches.delete(matchId);
						console.log(`🗑️ Partida ${matchId} eliminada`);
					}
				}
				partida.jugadores.forEach((jugadorSocket) => {
					if (jugadorSocket.readyState === 1) {
						jugadorSocket.send(JSON.stringify(payload));
					}
				});

			}, 1000 / 60); // 60 FPS


			connection.on('message', (msg) => {
				const movment = JSON.parse(msg);
				console.log(`📨 Acción en partida ${matchId}:`, movment);
				// Reenviar a los demás jugadores
				partida.jugadores.forEach((jugadorSocket) => {
					if (jugadorSocket.readyState === 1) {
						if (Number(partida.idPlayer1) === Number(movment.id)) {
							partida.player1 = movment.player;
						} else if (Number(partida.idPlayer2) === Number(movment.id)) {
							partida.player2 = movment.player
						}
					}
				});

			});

			connection.on('close', () => {
				partida.jugadores.delete(connection);
				if (partida.jugadores.size === 0) {
					clearInterval(partida.intervalId); // Detener game loop
					this.matches.delete(matchId);
					console.log(`🗑️ Partida ${matchId} eliminada`);
				}
			});

		} catch (err) {
			console.error("Error en la conexión WebSocket:", err);
			connection.send(JSON.stringify({ error: "Error al obtener mensajes" }));
			connection.close();

		}
	};

	async onStatusChange(req: any, status: string): Promise<void> {
		//let userId:{ user:string, roles: string[] } = await req.jwtVerify();
		//TODO: buscar a todos los emparejamientos y moverle el bowl
		return;
	};

}
