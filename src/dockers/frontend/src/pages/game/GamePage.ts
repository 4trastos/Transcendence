import { Component, ComponentProps, mount } from "../../utils/component";
import { GameData, GameStarter, MatchData } from "./GameSate";

export class GamePage extends Component {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private player1Score = 0;
  private player2Score = 0;
  private player1CanHit = true;
  private player2CanHit = true;
  private gameState: GameStarter;
  private player1: any;
  private player2: any;
  private ball: any;
  private matchData?: MatchData;

  constructor() {
    super();
    this.template = this.renderTemplate();
    this.gameState = new GameStarter({
      onComplete: (data: MatchData) => {
        this.matchData = data;
        this.resetScore();
        //TODO puedo generar o hacer que se reinicien los puntos haga animaciones o inicialice de alguna forma visual el Juego,
        console.log("Datos del juego completos: INICIAMOS");
      }
    });
  }

  renderTemplate() {
    return `
<div class="w-screen h-screen my-12 xl:my-0 flex flex-col justify-center items-center">
  <div id="game" class="bg-[#11162F] shadow-[0_0_20px_rgba(0,0,0,0.3)]  shadow-xl relative overflow-hidden z-50">

    <div class="backdrop-[#11162F]  bottom-4 right-4 w-fit h-[30rem]  flex flex-col overflow-hidden">
        <!-- Encabezado -->
        <div id="list-header" class="justify-center items-center relative flex p-4 border-b border-white items-center border-opacity-10">
          <div class="flex flex-row items-center gap-4" > 
          <h2 id="player_1" class="pointer-events-none text-white text-sm font-semibold">Player 1</h2>
          <h2 id="points_1" class="pointer-events-none text-white text-sm font-bold">0</h2>
          <hr id="divider" class="h-4 border-xl border-white border-opacity-15" />

            <h2 id="player_2" class="pointer-events-none text-white text-sm font-semibold">Player 2</h2>
            <h2 id="points_2" class="pointer-events-none text-white text-sm font-bold">0</h2>
          </div>
        </div>
        <div class="relative overflow-auto flex items-center justify-center">
          <!-- Canvas -->
          <canvas id="pong" width="800" height="400" class="z-0"></canvas>
        </div>
        <div class="absolute inset-y-0 left-0 w-[5px] bg-gradient-to-b rounded-l from-[#E615F2] to-[#1ADEF9]"></div>
        <div class="absolute inset-y-0 right-0 w-[5px] bg-gradient-to-b rounded-r from-[#E615F2] to-[#1ADEF9]"></div>

      </div>

      <div id="state-game-container" class="absolute inset-0 flex items-center justify-center">
      </div>
  </div>
</div>
    `;
  }
  protected async initEvents(): Promise<void> {
    this.canvas = this.element?.querySelector("#pong") as HTMLCanvasElement;
    this.ctx = this.canvas?.getContext("2d");

    if (!this.canvas || !this.ctx) {
      console.error("No canvas context found.");
      return;
    }

    const paddleWidth = 15, paddleHeight = 100, ballSize = 10;

    this.player1 = { x: 0, y: this.canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, color: "white", dy: 0 };
    this.player2 = { x: this.canvas.width - paddleWidth, y: this.canvas.height / 2 - paddleHeight / 2, width: paddleWidth, height: paddleHeight, color: "white", dy: 0 };
    this.ball = { x: this.canvas.width / 2, y: this.canvas.height / 2, radius: ballSize, speed: 4, dx: 4, dy: 0, color: "white" };

    const keyDownHandler = (e: KeyboardEvent) => {
      if (e.key === "w") this.player1.dy = -8;
      else if (e.key === "s") this.player1.dy = 8;
      if (e.key === "i") this.player2.dy = -8;
      else if (e.key === "k") this.player2.dy = 8;
    };

    const keyUpHandler = (e: KeyboardEvent) => {
      if (["w", "s"].includes(e.key)) this.player1.dy = 0;
      if (["i", "k"].includes(e.key)) this.player2.dy = 0;
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
    this.buildState();
  }

  private buildState() {
    if (!this.element) return;

    this.element?.getElementsByClassName
    const stateGame = this.element?.querySelector(
          "#state-game-container"
        ) as HTMLElement;

    stateGame.appendChild(this.gameState.render());
  }

  protected drawPaddle(paddle:any) {
      if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;

    // Crear un gradiente lineal desde arriba hacia abajo de la paleta
    const gradient = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x, paddle.y + paddle.height);
    gradient.addColorStop(0, '#E615F2');  // Color arriba
    gradient.addColorStop(1, '#1ADEF9');  // Color abajo

    ctx.fillStyle = gradient;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
  }
  private draw() {
    if (!this.ctx || !this.canvas) return;

    this.ctx.fillStyle = "#11162F";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = "#EEEEEE";
    this.ctx.fillRect(this.canvas.width / 2 - 8, 0, 8, this.canvas.height);

    this.drawPaddle(this.player1);
  
    this.drawPaddle(this.player2);

    this.ctx.fillStyle = this.ball.color;
    this.ctx.beginPath();
    this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, 2 * Math.PI);
    this.ctx.fill();
  }

  private movePaddles() {
    this.player1.y += this.player1.dy;
    this.player2.y += this.player2.dy;

    this.player1.y = Math.max(0, Math.min(this.canvas!.height - this.player1.height, this.player1.y));
    this.player2.y = Math.max(0, Math.min(this.canvas!.height - this.player2.height, this.player2.y));
  }

  private moveBall() {
    this.ball.x += this.ball.dx;
    this.ball.y += this.ball.dy;

    if (this.ball.y - this.ball.radius < 0 || this.ball.y + this.ball.radius > this.canvas!.height) {
      this.ball.dy = -this.ball.dy;
    }

    if (
      this.ball.x - this.ball.radius < this.player1.x + this.player1.width &&
      this.ball.y > this.player1.y && this.ball.y < this.player1.y + this.player1.height && this.player1CanHit
    ) {
      this.ball.dy > 0 ? this.ball.dx++ : this.ball.dy--;
      this.player1.dy > 0 ? this.ball.dx++ : this.player1.dx < 0 ? this.ball.dy-- : this.ball.dy = this.ball.dy;
      this.ball.dx = -this.ball.dx;
      this.player1CanHit = false;
      this.player2CanHit = true;
    }

    if (
      this.ball.x + this.ball.radius > this.player2.x &&
      this.ball.y > this.player2.y && this.ball.y < this.player2.y + this.player2.height && this.player2CanHit
    ) {
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
    } else if (this.ball.x + this.ball.radius > this.canvas!.width) {
      this.player1Score++;
      this.updateScore();
      this.resetBall();
    }
  }

  private resetBall() {
    this.ball.x = this.canvas!.width / 2;
    this.ball.y = this.canvas!.height / 2;
    this.ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
    this.ball.dy = 0
    this.player1CanHit = true;
    this.player2CanHit = true;
  }

  private resetScore(){
    const p1 = this.element?.querySelector("#points_1");
    const p2 = this.element?.querySelector("#points_2");
    if (p1)
      p1.textContent = String(0);
    if (p2)
      p2.textContent = String(0);
    this.player1Score = 0;
    this.player2Score = 0;
    return;

  }
  private updateScore() {
    if (!this.matchData) return;
    const p1 = this.element?.querySelector("#points_1");
    const p2 = this.element?.querySelector("#points_2");
    if (this.matchData.status==='started' && (this.player2Score >= 3 || this.player1Score >= 3) && this.matchData.players) {
      let winnerName;
      if (this.player1Score >= 3)
        this.matchData.winner = this.matchData.players[0];
      else if (this.player2Score >= 3)
        this.matchData.winner = this.matchData.players[1];

      this.matchData.status = "finished";
      this.resetScore();
      this.gameState.setMatchData(this.matchData);
      console.log("Juego finalizado");
      return;
    }
    if (p1)
      p1.textContent = String(this.player1Score);
    if (p2)
      p2.textContent = String(this.player2Score);
  }
}

interface GamePageProps extends ComponentProps {
  userId: string;
  gameId: string;
}