import { MatchGameComponent } from "../../../components/game/MatchGameComponent";
import { ResultGameComponent } from "../../../components/game/ResultGameComponent";
import { ChooseGameTypeState } from "./ChooseGameTypeState";
import { GameStarter, GameState, MatchData } from "./GameSate";

/**
 * 1.  debo mostrar quien compite y su grafica, dos estados el inicio de la competicion
 * 2. debo mostrar el final de la competicion
 */
export class HandleTournamentState implements GameState {
  protected container;
  private round = 0;
  protected players?: string[];
  protected nextPlayers?: string[];// lOS GANADORES DEL SIGUIENTE ROUND
  constructor(private context: GameStarter) {
	this.container = document.createElement("div");
	this.players = this.context.getGameData().players;
  }



  render(): HTMLElement {
	this.container.id = "tournament-state";
	this.displayTournamentState();
	this.context.onChange(()=>{
	  const matchData:MatchData = this.context.getMatchData();
	  if (matchData.status === 'finished') {
		//TODO: Enviar un post del Juego 
		if (matchData.winner) {
			this.saveGame();
			if (!this.nextPlayers) this.nextPlayers = new Array(matchData.winner);
			else this.nextPlayers?.push(matchData.winner);
			this.context.addWinner(matchData.winner, this.round);
		}
		this.players = this.players?.filter(item=>!matchData.players?.includes(item));
		this.container.innerHTML = '';
		const resultGame = new ResultGameComponent({
		  name: matchData.winner!,
		  players: this.context.getGameData().players,
		  winners: this.context.getGameData().winners,
		  onContinue: () => {
			this.displayTournamentState();
		  }
		});
		this.container.appendChild(resultGame.render());
	  }
	});
	return this.container;
  }
  
  async saveGame() {
	const matchData:MatchData = this.context.getMatchData();
	const losser = this.players?.findLast(item =>item !== matchData.winner);
	const body = {
			winner_id: matchData.winner,
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
				},
				body: JSON.stringify(body),
				credentials: "include", // Incluir cookies en la solicitud
			}
		);
		if (response.ok) {

		}
  }
  
  getTwoRandomStrings(arr: string[]): [string, string] {
	const shuffled = [...arr].sort(() => Math.random() - 0.5);
	return [shuffled[0], shuffled[1]];
  }
  displayTournamentState() {
	if ((this.nextPlayers && this.nextPlayers.length > 1 )){
	  this.players = this.nextPlayers;
	  this.nextPlayers = undefined;
	  this.round++;
	}
	else if ((!this.players || this.players.length <= 1)) {
	  //TODO: Ya finalizo el Juego, Debemos pasar a una pantalla de Informacion de Final
	  //TODO: Crear un Componente que diga, volver a Jugar, y que haga un CallBack para reiniciar
	  console.log("Finalizamos el Torneo", this.players);
	  this.context.setState(new ChooseGameTypeState(this.context));
	  return;
	}

	const [fisrt, second] = this.getTwoRandomStrings(this.players)!;
	console.log(fisrt, second, this.players);

	const matchGame = new MatchGameComponent({
	  players:[fisrt, second],
	  onDestroy: ()=>{
		this.context.setMatchData({
		  status:'started',
		  players: [fisrt ,second], // Dos jugadores aleatorios
		});
		this.context.completeGameSetup();
	  }
	});
	this.container.appendChild(matchGame.render());
  }
  next(): void {
  }
}
