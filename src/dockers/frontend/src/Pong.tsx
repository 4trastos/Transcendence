import React, { useEffect, useState } from "react";
import axios from "axios";
import bgImg from './assets/imgs/bg.png';

const Pong = () => {
    const [player1Score, setPlayer1Score] = useState(0);
    const [player2Score, setPlayer2Score] = useState(0);
    const [gameHistory, setGameHistory] = useState([]);

    const sendResultsToDB = async (p1, p2) => {
        try {
            const response = await axios.post(
                "/api/gameResult",
                { Player1: p1, Player2: p2 },
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log("Resultados enviados a la base de datos:", response.data);
        } catch (error) {
            console.error("Error al enviar los resultados:", error);
        }
    };

    const fetchGameHistory = async () => {
        try {
            const response = await axios.get('/api/gameHistory', {
                withCredentials: true
            });
            setGameHistory(response.data);
        } catch (error) {
            console.error("Error al obtener historial:", error);
        }
    };

    useEffect(() => {
        fetchGameHistory();
    }, []);

    useEffect(() => {
      if (player1Score === 3 || player2Score === 3){
        sendResultsToDB(player1Score, player2Score);
        fetchGameHistory();
      }
    }, [player1Score, player2Score])

    useEffect(() => {
        const canvas = document.getElementById('pong') as HTMLCanvasElement;
        const ctx = canvas?.getContext('2d');
        const paddleWidth = 15, paddleHeight = 100;
        const ballSize = 10;

        if (!canvas || !ctx) {
            console.error("Error: No se encontró el canvas.");
            return;
        }

        const player1 = { x: 0, y: canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, color: "white", dy: 0 };
        const player2 = { x: canvas.width - paddleWidth, y: canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, color: "white", dy: 0 };
        const ball = { x: canvas.width / 2, y: canvas.height / 2, radius: ballSize, speed: 4, dx: 4, dy: 4, color: "white" };

        const draw = () => {
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = player1.color;
            ctx.fillRect(player1.x, player1.y, player1.width, player1.height);
            ctx.fillStyle = player2.color;
            ctx.fillRect(player2.x, player2.y, player2.width, player2.height);
            ctx.fillStyle = ball.color;
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.fill();
        };

        const movePaddles = () => {
            player1.y += player1.dy;
            player2.y += player2.dy;
            player1.y = Math.max(0, Math.min(canvas.height - player1.height, player1.y));
            player2.y = Math.max(0, Math.min(canvas.height - player2.height, player2.y));
        };

        const moveBall = () => {
            ball.x += ball.dx;
            ball.y += ball.dy;

            if (ball.y - ball.radius < 0 || ball.y + ball.radius > canvas.height) {
                ball.dy = -ball.dy;
                ball.speed += 0.075;
            }

            if (ball.x - ball.radius < player1.x + player1.width && ball.y > player1.y && ball.y < player1.y + player1.height) {
                ball.dx = -ball.dx;
                ball.speed += 0.2;
            }

            if (ball.x + ball.radius > player2.x && ball.y > player2.y && ball.y < player2.y + player2.height) {
                ball.dx = -ball.dx;
                ball.speed += 0.2;
            }

            if (ball.x - ball.radius < 0) {
                setPlayer2Score(prevScore => prevScore + 1);
                resetBall();
            } else if (ball.x + ball.radius > canvas.width) {
                setPlayer1Score(prevScore => prevScore + 1);
                resetBall();
            }
        };

        const resetBall = () => {
            ball.x = canvas.width / 2;
            ball.y = canvas.height / 2;
            ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
            ball.dy = 4 * (Math.random() > 0.5 ? 1 : -1);
            ball.speed = 4;
        };

        const keyDownHandler = (e: KeyboardEvent) => {
            if (e.key === "w") player1.dy = -8;
            else if (e.key === "s") player1.dy = 8;
            if (e.key === "i") player2.dy = -8;
            else if (e.key === "k") player2.dy = 8;
        };

        const keyUpHandler = (e: KeyboardEvent) => {
            if (e.key === "w" || e.key === "s") player1.dy = 0;
            if (e.key === "i" || e.key === "k") player2.dy = 0;
        };

        document.addEventListener("keydown", keyDownHandler);
        document.addEventListener("keyup", keyUpHandler);

        const gameLoop = () => {
            movePaddles();
            draw();
            moveBall();
            requestAnimationFrame(gameLoop);
        };

        gameLoop();

        return () => {
            document.removeEventListener("keydown", keyDownHandler);
            document.removeEventListener("keyup", keyUpHandler);
        };
    }, []);

    return (
        <div
            className="overflow-auto flex-1 flex items-center justify-center min-h-screen"
            style={{
                backgroundImage: `url(${bgImg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed',
            }}
        >
            <canvas
                id="pong"
                width="800"
                height="400"
            >
            </canvas><br></br>
            <label id="player1id">Player 1: </label><label id="points_1">{player1Score}</label>
            <label id="player2id">Player 2: </label><label id="points_2">{player2Score}</label>
            <div>
                <h2>Historial de Juegos</h2>
                <ul>
                    {gameHistory.map((game, index) => (
                        <li key={index}>
                            Jugador 1: {game.Player1}, Jugador 2: {game.Player2}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Pong;