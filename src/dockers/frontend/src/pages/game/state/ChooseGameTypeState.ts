import { GameStarter, GameState } from "./GameSate";
import { SelectPlayersState } from "./SelectPlayersState";

export class ChooseGameTypeState implements GameState {
  constructor(private context: GameStarter) {}

  render(): HTMLElement {
	const container = document.createElement("div");
	container.className = "flex items-center justify-center px-[5px] rounded bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)] shadow-[0_0_20px_rgba(0,0,0,0.5)]";
	container.innerHTML = `
	  <div class="bg-[#11162F] p-6 text-white justify-center items-center text-center space-y-4">
		<h2 >🎮 Elige el tipo de juego</h2>
		<div class=" space-x-2 flex flex-row justify-center items-center">
		  <div class="p-[1px] rounded-lg bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)]">
			<div class="bg-[#11162F] w-[8rem] h-full rounded-lg"> 
			  <button id="btn-torneo" class="w-full h-full rounded-lg bg-[#11162F] hover:bg-white/30 p-1">Torneo</button>
			</div>
		  </div>
		  <div class="p-[1px] rounded-lg bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)]">
			<div class="bg-[#11162F] w-[8rem] h-full rounded-lg"> 
			  <button id="btn-amistoso" class="w-full h-full rounded-lg bg-[#11162F] hover:bg-white/30 p-1">Amistoso</button>
			</div>
		  </div>
		</div>
	  </div>
	`;

	container.querySelector('#btn-torneo')?.addEventListener('click', () => {
	  this.context.setGameType('torneo');
	  this.context.setState(new SelectPlayersState(this.context));
	});

	return container;
  }

  next(): void {}
}
