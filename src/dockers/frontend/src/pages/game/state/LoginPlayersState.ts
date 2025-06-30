import { LoginPlayerComponent } from "../../../components/player/LoginPlayer";
import { PlayersComponent } from "../../../components/player/PlayersComponent";
import { ToastService } from "../../../utils/toast";
import { GameStarter, GameState } from "./GameSate";
import { HandleTournamentState } from "./HandleTournamentState";

//TODO: El primer usuario es el que esta logeado.
export class LoginPlayersState implements GameState {
	private current = 1;
	private playersComponent: PlayersComponent;
	private context: GameStarter;

	constructor(context: GameStarter, private totalPlayers: number) {
		this.context = context;
		const userJwt = this.context.getUserJwt();
		const nPlayers = this.context.getGameData().playersCount || 0;
		this.playersComponent = new PlayersComponent({
			onCompleted(data: any[]) {
				//TODO: Data contendra los username de cada Player
				context.updatePlayers(data);
				console.log("Players: ", data);
				context.setState(new HandleTournamentState(context));
			},
			onSelected(idx) {

			},
			nPlayers: nPlayers || 0,
			players: Array.from({ length: nPlayers }, (_, i) => ({
				idx: "player-" + i,
				avatar: i==0 ? userJwt.avatar:'', //Mostrar una imagen temporal
				nick: i==0 ? userJwt.user : "User " + i,
				hasLogged: i === 0,
				isCurrent: i === 1,
			}))
		});
	}

	render(): HTMLElement {
		const container = document.createElement("div");
		container.className = "flex flex-row items-start justify-center items-center gap-4";

		container.innerHTML = `
	<!-- Contenido Lista de Usuarios -->
  <div class="flex items-center justify-center">
	<div id="players-container" class="animate-expand-from-center h-fill w-fill relative px-[5px] rounded bg-gradient-animate  shadow-[0_0_20px_rgba(0,0,0,0.5)]">
	</div>
  </div>
		<!-- Contenido LOG IN -->
<div id="game-login-player" class="animate-expand-from-center flex items-center justify-center px-[5px] rounded bg-gradient-animate shadow-[0_0_20px_rgba(0,0,0,0.5)]">

</div>

</div>
	`;
		const participant = container.querySelector("#players-container");

		participant?.appendChild(this.playersComponent.render());
		// Crear el div padre

		const loginComponent = container.querySelector('#game-login-player')
		const loginPlayerComponent = new LoginPlayerComponent({
			onComplete: (username: string, avatar:string) => {
				try {
					this.playersComponent.updateCurrent(username, avatar);
				} catch (err) {
					loginPlayerComponent.showError();
					if (err instanceof Error)
						ToastService.show(err.message, "error");
				}
			},
			onError: () => {
				//TODO: Esto no debe estar aqui, debe haber un error o un algo
			}
		});

		loginComponent?.appendChild(loginPlayerComponent.render());


		return container;
	}


	next(): void { }
}


