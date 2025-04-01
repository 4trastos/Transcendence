import React, { useEffect } from "react";
import axios from "axios";
import bgImg from './assets/imgs/bg.png';


const Pong = () => {

    const sendResultsToDB = (p1, p2) => {
        try {
            axios.post("http://localhost:3000/api/gameResult", {Player1: p1, Player2: p2});
        } catch (error: any) {

        }
    };

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

            if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
                resetBall();
                if (ball.x - ball.radius < 0) {
                    var p2 = document.getElementById("points_2")?.innerHTML;
                    p2 = parseInt(p2) + 1;
                    document.getElementById("points_2").innerHTML = p1;
                } else {
                    var p1 = document.getElementById("points_1")?.innerHTML;
                    p1 = parseInt(p1) + 1;
                    document.getElementById("points_1").innerHTML = p1;
                }
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
            if (document.getElementById("points_1").innerHTML == "3" || document.getElementById("points_2").innerHTML == "3"){
                sendResultsToDB(document.getElementById("points_1").innerHTML, document.getElementById("points_2").innerHTML);
            } else {
                movePaddles();
                draw();
                moveBall();
                requestAnimationFrame(gameLoop);
            }
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
            <label id="player1id">Player 1: </label><label id="points_1">0</label>
            <label id="player2id">Player 2: </label><label id="points_2">0</label>
        </div>
    );
};

export default Pong;