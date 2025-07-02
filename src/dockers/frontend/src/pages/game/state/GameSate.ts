import { UserJwt } from "../../../data/UserJwt";
import { reactive } from "../../../lib/reactive";
import { Component,ComponentProps } from "../../../utils/component"
import { ChooseGameTypeState } from "./ChooseGameTypeState";

export interface GameStarterProps extends ComponentProps {
    userJwt: UserJwt;
	  onComplete?: (data: GameData, server?: any) => void;
}
export interface GameState {
  render(): HTMLElement;
  next(): void;
}
export interface GameData {
  gameType?: "torneo" | "1vs1";
  winners?:{winner:string, round:number}[];
  playersCount?: number;
  players?: string[];
  status?: string;
}

export interface MatchData {
  gameType?: "torneo" | "1vs1";
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
  protected props: GameStarterProps;
  protected gameData: GameData;
  protected matchData: MatchData;

  constructor(props: GameStarterProps) {
    super(props);
    this.props = props;
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

  public getUserJwt(): UserJwt {
    return this.props.userJwt;
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
  public setGameType(type: "torneo" | "1vs1") {
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
  public completeGameSetup(server?:any) {
    if (this.props.onComplete) {
      //Tener cuidado que no reaccione
      this.matchData.gameType = this.gameData.gameType;
      this.props.onComplete(this.matchData, server);
    }
  }
  // Lógica principal para renderizar el estado actual
  public render(): HTMLElement {
    this.element = this.state.render();
    return this.element;
  }
}

