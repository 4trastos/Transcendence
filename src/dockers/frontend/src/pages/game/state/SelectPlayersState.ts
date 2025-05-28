import { GameStarter, GameState } from "./GameSate";
import { LoginPlayersState } from "./LoginPlayersState";

export class SelectPlayersState implements GameState {
  constructor(private context: GameStarter) {}

  render(): HTMLElement {
	const container = document.createElement("div");
	container.className = "flex items-center justify-center px-[5px] rounded bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)] shadow-[0_0_20px_rgba(0,0,0,0.5)]";
	container.innerHTML = `
	  <div class="bg-[#11162F] p-6 text-white justify-center items-center text-center">
		<h2>👥 Selecciona número de jugadores</h2>
		<div class=" space-x-2 flex flex-row justify-center items-center">
		  <div class="p-[1px] rounded-full bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)]">
			<div class="bg-[#11162F] w-[2rem] h-full rounded-full"> 
			  <button data-num="2" class="w-full h-full rounded-full bg-[#11162F] hover:bg-white/30 p-1">2</button>
			</div>
		  </div>
		  <div class="p-[1px] rounded-full bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)]">
			<div class="bg-[#11162F] w-[2rem] h-full rounded-full"> 
			  <button data-num="4" class="w-full h-full rounded-full bg-[#11162F] hover:bg-white/30 p-1">4</button>
			</div>
		  </div>
		  <div class="p-[1px] rounded-full bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)]">
			<div class="bg-[#11162F] w-[2rem] h-full rounded-full"> 
			  <button data-num="8" class="w-full h-full rounded-full bg-[#11162F] hover:bg-white/30 p-1">8</button>
			</div>
		  </div>
		<div>
	  </div>
	`;

	container.querySelectorAll("button").forEach((btn) =>
	  btn.addEventListener("click", () => {
		const num = Number((btn as HTMLButtonElement).dataset.num);
		this.context.setPlayersCount(num);
		this.context.setState(new LoginPlayersState(this.context, num));
	  })
	);

	return container;
  }

  next(): void {}
}
