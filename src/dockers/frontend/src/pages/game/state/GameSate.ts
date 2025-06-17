import { reactive } from "../../../lib/reactive";
import { Component,ComponentProps } from "../../../utils/component"
import { ChooseGameTypeState } from "./ChooseGameTypeState";

export interface GameStarterProps extends ComponentProps {
	  onComplete?: (data: GameData) => void;
}
export interface GameState {
  render(): HTMLElement;
  next(): void;
}
export interface GameData {
  gameType?: string;
  winners?:{winner:string, round:number}[];
  playersCount?: number;
  players?: string[];
  status?: string;
}

export interface MatchData {
  players?: string[];
  status?: string;
  winner?: string;
}

export class GameStarter extends Component {
  private state: GameState;//Utilizo Proxy para que se quede escuchando un evento, que es el de ganador o no
  private _subscribe: (cb:()=>void) => void;
  private _clearObservers: () => void;
  private _pause: ()=>void;
  private _resume: ()=>void;

  protected gameData: GameData;
  protected matchData: MatchData;

  constructor(props: GameStarterProps) {
    super(props);
    const [reactiveData, {subscribe, clearObservers, pause, resume}] = reactive({players: []});
    this._subscribe = subscribe;
    this._clearObservers = clearObservers;
    this.matchData = reactiveData;
    this._resume = resume;
    this._pause = pause;
    this.gameData = {players:[]};
    this.state = new ChooseGameTypeState(this);
  }

  /**
   * 
   * @param cb Funcion que se va a ejecutar(subscribe) cuando haya cambios en gameData
   */
  public onChange(cb:()=> void) {
    this._subscribe(cb);
  }

  public setState(state: GameState) {
    this.state = state;
    this._clearObservers();
    this.update();
  }

  public updateCurrentState(state: GameState) {
    this.state = state;
    this.update();
  }
  public setGameType(type: string) {
    this.gameData.gameType = type;
  }

  public setPlayersCount(count: number) {
    this.gameData.playersCount = count;
    this.gameData.players = new Array(count)
      .fill('')
      .map((_, i) => `Player ${i + 1}`);

  }

  public updatePlayers(updatePlayers: string[]) {
    this.gameData.players = updatePlayers;
  }
  public setMatchData(matchData: MatchData) {
    this._pause();
    this.matchData.status = matchData.status;
    this.matchData.winner = matchData.winner;
    this._resume();
    this.matchData.players = matchData.players;
  }
  public addWinner(winner: string, round: number){
    this.gameData.winners?.push({winner:winner, round:round});
  }
  public setPlayer(index:number, name: string) {
    if (this.gameData.players) {
      this.gameData.players[index] = name;
    }
  }
  public getMatchData(): MatchData {
    return this.matchData;
  }
  public getGameData(): GameData {
    return this.gameData;
  }
  public completeGameSetup() {
    if (this.props.onComplete) {
      this.props.onComplete(this.matchData);
    }
  }
  // Lógica principal para renderizar el estado actual
  public render(): HTMLElement {
    this.element = this.state.render();
    return this.element;
  }
}

