import React, { useEffect, useState } from "react"; // Añade useState
import axios from "axios";
import bgImg from './assets/imgs/bg.png';

interface GameHistory {
    id: number;
    player1_id: number;
    player2_id: number;
    score_player1: number;
    score_player2: number;
    winner_id: number;
    played_at: string;
}

const Pong = () => {
    const [player1Score, setPlayer1Score] = useState(0);
    const [player2Score, setPlayer2Score] = useState(0);

    var player1Data = localStorage.getItem('user')
    player1Data = JSON.parse(player1Data?player1Data:"nada")
    var player2Data = localStorage.getItem('user')
    player2Data = JSON.parse(player2Data?player2Data:"nada")

    const sendResultsToDB = async (p1Score: string, p2Score: string) => {
        try {
            // Obtener el usuario actual del localStorage
            const userData = localStorage.getItem("user");
            if (!userData) throw new Error("No hay usuario logueado");
            
            const [userId, username] = JSON.parse(userData).split(" ");
            
            // Enviar datos al backend
            const response = await axios.post("/api/gameResult", {
                player1_id: userId,
                player2_id: 0,
                score_player1: (p1Score),
                score_player2: (p2Score),
                winner_id: (p1Score) > (p2Score) ? userId : 0
            }, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            console.log("Resultado guardado:", response.data);
            fetchGameHistory(); // Actualizar el historial después de guardar
        } catch (error) {
            console.error("Error al guardar resultado:", error);
        }
    };

    const fetchGameHistory = async () => {
        try {
            const userData = localStorage.getItem("user");
            if (!userData) throw new Error("No hay usuario logueado");
            
            const [userId] = JSON.parse(userData).split(" ");
            
            const response = await axios.get(`/api/gameHistory?user_id=${userId}`, {
                withCredentials: true
            });
            setGameHistory(response.data);
        } catch (error) {
            console.error("Error al obtener historial:", error);
        }
    };

    useEffect(() => {
        if (player1Score === 3 || player2Score === 3) {
            sendResultsToDB(player1Score, player2Score);
            fetchGameHistory();
            setPlayer1Score(0);
            setPlayer2Score(0);
        }
    }, [player1Score, player2Score]);

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
            className="overflow-auto flex items-center justify-center min-h-screen"
            style={{
            backgroundImage: `url(${bgImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
            }}
        >
            <div className="flex">
                <canvas 
                    id="pong" 
                    width="800" 
                    height="400"
                >
                </canvas>
            </div>
            <div className="flex">
                <label id="player1id">{ player1Data?.username }</label><label id="points_1">{ player1Score }</label>
                <label id="player2id">{ player2Data?.username }</label><label id="points_2">{ player2Score }</label>
            </div>
        </div>
    );
};

export default Pong;