import { Component } from "../../utils/component";
export declare class GamePage extends Component {
    private canvas;
    private ctx;
    private player1Score;
    private player2Score;
    private player1CanHit;
    private player2CanHit;
    private player1;
    private player2;
    private ball;
    constructor();
    renderTemplate(): string;
    protected initEvents(): Promise<void>;
    private draw;
    private movePaddles;
    private moveBall;
    private resetBall;
    private updateScore;
}
