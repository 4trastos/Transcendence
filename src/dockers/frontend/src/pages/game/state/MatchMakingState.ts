import { MatchGameComponent } from "../../../components/game/MatchGameComponent";
import { ResultGameComponent } from "../../../components/game/ResultGameComponent";
import { ChooseGameTypeState } from "./ChooseGameTypeState";
import { GameStarter, GameState, MatchData } from "./GameSate";
import { LoginPlayersState } from "./LoginPlayersState";

export class MatchMakingState implements GameState {
	protected container;
	private round = 0;
	protected player: string;
	protected nextPlayers?: string[];// lOS GANADORES DEL SIGUIENTE ROUND

	constructor(private context: GameStarter) {
		this.container = document.createElement("div");
		const userJwt = this.context.getUserJwt();
		this.player = userJwt.user;
	}

	render(): HTMLElement {
		this.container.id = "matchmaking-state";

		//Me conecto por WebSocket
		const matchSocket = new WebSocket('http://localhost:3050/matchmaking');//Hay que finalizar la sesion?

		matchSocket.onmessage = (msg) => {
			const data = JSON.parse(msg.data);
			if (data.type === 'match_found') {
				//Aqui debo recopilar los datos de los jugadores
				const partidaSocket = new WebSocket(`http://localhost:3050/match/${data.matchId}`);
				
				partidaSocket.onopen = () => {
					console.log('Conectado a la partida 🎮');
					this.displayTournamentState(partidaSocket);
				};

				partidaSocket.addEventListener('message', (event) =>  {
					const update = JSON.parse(event.data);
					if (update.status === 'finished') {
						partidaSocket.close();

						console.log(update)
						//TODO: DEBE GUARDAR TODO EN EL SERVIDOR

						if (update.winner) {
							if (!this.nextPlayers) this.nextPlayers = new Array(update.winner);
							else this.nextPlayers?.push(update.winner);
							this.context.addWinner(update.winner, this.round);
						}

						this.container.innerHTML = '';
						const resultGame = new ResultGameComponent({
							name: update.winner!,
							players: this.context.getGameData().players,
							winners: this.context.getGameData().winners,
							onContinue: () => {
								this.context.setState(new ChooseGameTypeState(this.context));
							}
						});
						this.container.appendChild(resultGame.render());
					}
				});
			} else { 
				matchSocket.close();
			}
		};

		this.container.className = "animate-expand-from-center flex items-center justify-center px-[5px] rounded bg-gradient-animate shadow-[0_0_20px_rgba(0,0,0,0.5)]";
		this.container.innerHTML = `
			<div class="reveal-content bg-[#11162F] p-6 space-y-4 text-white justify-center items-center text-center">
				<h2 class="reveal-content-child">👥 Esperando jugadores</h2>
				<div class="reveal-content-child space-x-2 flex flex-row justify-center items-center">
					<div class="p-[1px] rounded-full bg-gradient-animate">
						<div class="bg-[#11162F] w-[3rem] h-[3rem] rounded-full"> 
							<button data-num="2" class="ripple w-full h-full rounded-full bg-[#11162F] hover:bg-white/30 p-1">Salir</button>
						</div>
					</div>
				<div>
			</div>
		`;

		this.container.querySelectorAll("button").forEach((btn) =>
			btn.addEventListener("click", () => {
				const num = Number((btn as HTMLButtonElement).dataset.num);
				this.context.setPlayersCount(num);
				this.context.setState(new LoginPlayersState(this.context, num));
			})
		);

		return this.container;
	}




	displayTournamentState(server: any) {
		if ((!this.player)) {
			this.context.setState(new ChooseGameTypeState(this.context));
			return;
		}

		console.log(this.player);
		this.container.innerHTML = '';
		const matchGame = new MatchGameComponent({
		players: [this.player, ""],
		onDestroy: ()=>{
			this.context.setMatchData({
				status:'started',
				players: [this.player],
			});
			this.context.completeGameSetup(server);
		}
		});
		this.container.appendChild(matchGame.render());
	}

  next(): void {}
}
