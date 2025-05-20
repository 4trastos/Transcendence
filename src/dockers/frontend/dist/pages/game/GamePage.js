import { Component } from "../../utils/component";
export class GamePage extends Component {
    constructor() {
        super();
        this.canvas = null;
        this.ctx = null;
        this.player1Score = 0;
        this.player2Score = 0;
        this.player1CanHit = true;
        this.player2CanHit = true;
        this.template = this.renderTemplate();
    }
    renderTemplate() {
        return `
      <div 
        class="overflow-auto flex items-center justify-center min-h-screen" 
        <div class="flex">
          <canvas id="pong" width="800" height="400"></canvas>
        </div>
        <div class="flex space-x-4 text-white text-lg mt-4">
          <label id="player1id">Player 1</label><label id="points_1">0</label>
          <label id="player2id">Player 2</label><label id="points_2">0</label>
        </div>
      </div>
    `;
    }
    async initEvents() {
        this.canvas = this.element?.querySelector("#pong");
        this.ctx = this.canvas?.getContext("2d");
        if (!this.canvas || !this.ctx) {
            console.error("No canvas context found.");
            return;
        }
        const paddleWidth = 15, paddleHeight = 100, ballSize = 10;
        this.player1 = { x: 0, y: this.canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, color: "white", dy: 0 };
        this.player2 = { x: this.canvas.width - paddleWidth, y: this.canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, color: "white", dy: 0 };
        this.ball = { x: this.canvas.width / 2, y: this.canvas.height / 2, radius: ballSize, speed: 4, dx: 4, dy: 0, color: "white" };
        const keyDownHandler = (e) => {
            if (e.key === "w")
                this.player1.dy = -8;
            else if (e.key === "s")
                this.player1.dy = 8;
            if (e.key === "i")
                this.player2.dy = -8;
            else if (e.key === "k")
                this.player2.dy = 8;
        };
        const keyUpHandler = (e) => {
            if (["w", "s"].includes(e.key))
                this.player1.dy = 0;
            if (["i", "k"].includes(e.key))
                this.player2.dy = 0;
        };
        document.addEventListener("keydown", keyDownHandler);
        document.addEventListener("keyup", keyUpHandler);
        const gameLoop = () => {
            this.movePaddles();
            this.draw();
            this.moveBall();
            requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }
    draw() {
        if (!this.ctx || !this.canvas)
            return;
        this.ctx.fillStyle = "black";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "#EEEEEE";
        this.ctx.fillRect(this.canvas.width / 2 - 8, 0, 8, this.canvas.height);
        this.ctx.fillStyle = this.player1.color;
        this.ctx.fillRect(this.player1.x, this.player1.y, this.player1.width, this.player1.height);
        this.ctx.fillStyle = this.player2.color;
        this.ctx.fillRect(this.player2.x, this.player2.y, this.player2.width, this.player2.height);
        this.ctx.fillStyle = this.ball.color;
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, 2 * Math.PI);
        this.ctx.fill();
    }
    movePaddles() {
        this.player1.y += this.player1.dy;
        this.player2.y += this.player2.dy;
        this.player1.y = Math.max(0, Math.min(this.canvas.height - this.player1.height, this.player1.y));
        this.player2.y = Math.max(0, Math.min(this.canvas.height - this.player2.height, this.player2.y));
    }
    moveBall() {
        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;
        if (this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > this.canvas.height) {
            this.ball.dy = -this.ball.dy;
        }
        if (this.ball.x - this.ball.radius < this.player1.x + this.player1.width &&
            this.ball.y > this.player1.y && this.ball.y < this.player1.y + this.player1.height && this.player1CanHit) {
            this.ball.dy > 0 ? this.ball.dx++ : this.ball.dy--;
            this.player1.dy > 0 ? this.ball.dx++ : this.player1.dx < 0 ? this.ball.dy-- : this.ball.dy = this.ball.dy;
            this.ball.dx = -this.ball.dx;
            this.player1CanHit = false;
            this.player2CanHit = true;
        }
        if (this.ball.x + this.ball.radius > this.player2.x &&
            this.ball.y > this.player2.y && this.ball.y < this.player2.y + this.player2.height && this.player2CanHit) {
            this.ball.dx > 0 ? this.ball.dx++ : this.ball.dy--;
            this.player2.dy > 0 ? this.ball.dx++ : this.player2.dx < 0 ? this.ball.dy-- : this.ball.dy = this.ball.dy;
            this.ball.dx = -this.ball.dx;
            this.player1CanHit = true;
            this.player2CanHit = false;
        }
        // Score
        if (this.ball.x - this.ball.radius < 0) {
            this.player2Score++;
            this.updateScore();
            this.resetBall();
        }
        else if (this.ball.x + this.ball.radius > this.canvas.width) {
            this.player1Score++;
            this.updateScore();
            this.resetBall();
        }
    }
    resetBall() {
        this.ball.x = this.canvas.width / 2;
        this.ball.y = this.canvas.height / 2;
        this.ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
        this.ball.dy = 0;
        this.player1CanHit = true;
        this.player2CanHit = true;
    }
    updateScore() {
        const p1 = this.element?.querySelector("#points_1");
        const p2 = this.element?.querySelector("#points_2");
        if (p1)
            p1.textContent = String(this.player1Score);
        if (p2)
            p2.textContent = String(this.player2Score);
    }
}
//# sourceMappingURL=GamePage.js.map