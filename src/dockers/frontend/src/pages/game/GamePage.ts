import { Component, ComponentProps } from "../../utils/component";


class SelectOpponentView extends Component {
  protected props: ComponentProps;
  constructor(props: ComponentProps) {
    super(props);
    this.props = props;
    this.template = this.renderTemplate();
  }
  renderTemplate() {
    return `
  <div class="w-full h-full flex items-center justify-center">
    <div class="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center text-white text-2xl">
      Select an opponent
    </div>
  </div>`;
  }
}

class MatchedView extends Component {

}

class WaitingOpponentView extends Component {
  protected props: ComponentProps;
  constructor(props: ComponentProps) {
    super(props);
    this.props = props;
    this.template = this.renderTemplate();
  }
  renderTemplate() {
    return `
  <div class="w-full h-full flex items-center justify-center">
    <div class="w-32 h-32 bg-gray-800 rounded-full flex items-center justify-center text-white text-2xl">
      Waiting for opponent...
    </div>
  </div>`;
}
} 

class ScoreboardComponent extends Component {
  protected props: ComponentProps;
  constructor(props: ComponentProps) {
    super(props);
    this.props = props;
    this.template = this.renderTemplate();
  }

  renderTemplate() {
    return `
  <div id="scoreboard" class="w-32 h-16 bg-gray-800 rounded flex items-center justify-center text-white">
    <span id="score" class="text-2xl">0 - 0</span>
  </div>
  `;
  }
}

class Player  {

}

class PaddleComponent extends Component {
  protected props: ComponentProps;
  constructor(props: ComponentProps) {
    super(props);
    this.props = props;
    this.template = this.renderTemplate();
  }

  renderTemplate() {
    return `
  <div id="paddle" class="w-4 h-16 bg-blue-500 rounded"></div>
  `;
  }
}


class BolletComponent extends Component {
  protected props: ComponentProps;
  constructor(props: ComponentProps) {
  super(props);
  this.props = props;
  this.template = this.renderTemplate();
  }

  renderTemplate() {
  return `
  <div id="ball" class="w-4 h-4 bg-red-500 rounded-full"></div>
  `;
  }
}

class PongGameView extends Component {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private player1Score = 0;
  private player2Score = 0;

  private player1: any;
  private player2: any;
  private ball: any;

  constructor(props: ComponentProps) {
    super(props);
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
    this.ball = { x: this.canvas.width / 2, y: this.canvas.height / 2, radius: ballSize, speed: 4, dx: 4, dy: 4, color: "white" };

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
  }

  private draw() {
    if (!this.ctx || !this.canvas) return;

    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = this.player1.color;
    this.ctx.fillRect(this.player1.x, this.player1.y, this.player1.width, this.player1.height);

    this.ctx.fillStyle = this.player2.color;
    this.ctx.fillRect(this.player2.x, this.player2.y, this.player2.width, this.player2.height);

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
      this.ball.y > this.player1.y && this.ball.y < this.player1.y + this.player1.height
    ) {
      this.ball.dx = -this.ball.dx;
    }

    if (
      this.ball.x + this.ball.radius > this.player2.x &&
      this.ball.y > this.player2.y && this.ball.y < this.player2.y + this.player2.height
    ) {
      this.ball.dx = -this.ball.dx;
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
    this.ball.dy = 4 * (Math.random() > 0.5 ? 1 : -1);
  }

  private updateScore() {
    const p1 = this.element?.querySelector("#points_1");
    const p2 = this.element?.querySelector("#points_2");
    if (p1) p1.textContent = String(this.player1Score);
    if (p2) p2.textContent = String(this.player2Score);
  }
}

interface GamePageProps extends ComponentProps {
  userId: string;
  gameId: string;
}

class GamePage extends Component {
  private socket: WebSocket | undefined;
  private userId: string | undefined;
  private gameId: string | undefined;
  private gameData: any; // Cambia el tipo según la estructura de tus datos de juego
  private gameState: any; // Cambia el tipo según la estructura de tus datos de estado del juego

  constructor(userId: string, gameId: string) {
	super();
	this.userId = userId;
	this.gameId = gameId;
	this.template = this.renderTemplate();
  }

  renderTemplate() {
	return `
	<div class="game-view">
	</div>
	`;
  }

  protected async initEvents(): Promise<void> {
	if (!this.element) return;

	this.socket = new WebSocket("");
  }

}