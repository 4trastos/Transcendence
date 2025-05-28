import { LoginPlayerComponent } from "../../../components/player/LoginPlayer";
import { PlayersComponent } from "../../../components/player/PlayersComponent";
import { GameStarter, GameState } from "./GameSate";
import { HandleTournamentState } from "./HandleTournamentState";

export class LoginPlayersState implements GameState {
  private current = 1;
  private playersComponent: PlayersComponent;
  private context: GameStarter;

  constructor(context: GameStarter, private totalPlayers: number) {
	this.context = context;
	const nPlayers = this.context.getGameData().playersCount || 0;
	this.playersComponent = new PlayersComponent({
	  onCompleted(data:any[]){
		context.setState(new HandleTournamentState(context));
	  },
	  onSelected(idx) {

	  },
	  nPlayers: nPlayers || 0,
	  players: Array.from({ length: nPlayers }, (_, i) => ({
		idx: "player-"+i,
		nick: "User " + i,
		hasLogged: i === 0,
		isCurrent: i === 1,
	  }))
	});
  }

  render(): HTMLElement {
	const container = document.createElement("div");
	container.className="flex flex-row items-start justify-center items-center gap-4";

	container.innerHTML = `
	<!-- Contenido Lista de Usuarios -->
  <div class="flex items-center justify-center">
	<div id="players-container" class=" h-fill w-fill relative px-[5px] rounded bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)]  shadow-[0_0_20px_rgba(0,0,0,0.5)]">
	</div>
  </div>
		<!-- Contenido LOG IN -->
<div id="game-login-player" class="flex items-center justify-center px-[5px] rounded bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)] shadow-[0_0_20px_rgba(0,0,0,0.5)]">

</div>

</div>
	`;
	const participant = container.querySelector("#players-container");

  participant?.appendChild(this.playersComponent.render());
	// Crear el div padre

  const loginComponent = container.querySelector('#game-login-player')
  const loginPlayeComponent = new LoginPlayerComponent({
	onComplete:(data:any) =>{
	this.current++;
	  if (this.current > this.totalPlayers) {
		this.context.setState(new HandleTournamentState(this.context));
	  } else {
		this.context.setPlayer(this.current, data.name);
		this.playersComponent.updateCurrent(null);
	  }
	},
	onError:() => {
	  //TODO: Esto no debe estar aqui, debe haber un error o un algo
		this.playersComponent.updateCurrent(null);
	}
  });

  loginComponent?.appendChild(loginPlayeComponent.render());


	return container;
  }


  next(): void {}
}


