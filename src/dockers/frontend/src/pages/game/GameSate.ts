import { Component,ComponentProps } from "../../utils/component"


interface GameStarterProps extends ComponentProps {
	  onComplete?: (data: GameData) => void;
}
export interface GameState {
  render(): HTMLElement;
  next(): void;
}
export interface GameData {
  gameType?: string;
  playersCount?: number;
  players?: string[];
}

export class GameStarter extends Component {
  private state: GameState;
  protected gameData: GameData = {
    players: [],
  };
  constructor(props: GameStarterProps) {
    super(props);
    this.state = new ChooseGameTypeState(this);
  }

  public setState(state: GameState) {
    this.state = state;
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
    this.gameData.players = new Array(count).fill('');
  }

  public setPlayer(index: number, name: string) {
    if (this.gameData.players) {
      this.gameData.players[index] = name;
    }
  }

  public getGameData(): GameData {
    return this.gameData;
  }
    public completeGameSetup() {
    if (this.props.onComplete) {
      this.props.onComplete(this.gameData);
    }
  }
  // Lógica principal para renderizar el estado actual
  public render(): HTMLElement {
    this.element = this.state.render();
    return this.element;
  }
}

class ChooseGameTypeState implements GameState {
  constructor(private context: GameStarter) {}

  render(): HTMLElement {
    const container = document.createElement("div");
    container.className = "flex items-center justify-center px-[5px] rounded bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)] shadow-[0_0_20px_rgba(0,0,0,0.5)]";
    container.innerHTML = `
      <div class="bg-[#11162F] p-6 text-white justify-center items-center text-center">
        <h2 >🎮 Elige el tipo de juego</h2>
        <div class=" space-x-2 flex flex-row justify-center items-center">
          <div class="p-[1px] rounded-full bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)]">
            <div class="bg-[#11162F] w-[8rem] h-full rounded-full"> 
              <button id="btn-torneo" class="w-full h-full rounded-full bg-[#11162F] hover:bg-white/30 p-1">Torneo</button>
            </div>
          </div>
          <div class="p-[1px] rounded-full bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)]">
            <div class="bg-[#11162F] w-[8rem] h-full rounded-full"> 
              <button id="btn-amistoso" class="w-full h-full rounded-full bg-[#11162F] hover:bg-white/30 p-1">Amistoso</button>
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



class SelectPlayersState implements GameState {
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

class LoginPlayersState implements GameState {
  private current = 1;

  constructor(private context: GameStarter, private totalPlayers: number) {}

  render(): HTMLElement {
    const container = document.createElement("div");
	container.className="flex flex-row items-start justify-center items-center gap-4";

    container.innerHTML = `
    <!-- Contenido Lista de Usuarios -->
<div class="flex items-center justify-center">
	<div class=" h-fill w-fill relative px-[5px] rounded bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)]  shadow-[0_0_20px_rgba(0,0,0,0.5)]">

		<div id="participant" class="space-y-4 p-6 flex flex-col bg-[#11162F] "> 

		</div>

	</div>
</div>


	    <!-- Contenido LOG IN -->
<div class="flex items-center justify-center px-[5px] rounded bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)] shadow-[0_0_20px_rgba(0,0,0,0.5)]">

<!-- Contenido encima -->
    <div class="bg-[#11162F] relative z-10 pb-6 ">
	<div class="pb-6">
      <h1 class="text-center text-white text-md font-regular mb-2 mt-2">Iniciar Sesión</h1>
      <hr class="border-t border-white border-opacity-5" />
	  </div>
<form id="login-form" class="space-y-4 pl-16 pr-16">
  
  <!-- Usuario -->
  <div class="mb-1">
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="7" r="4" />
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        </svg>
      </div>
      <input type="text" name="username" placeholder="Username"
        class="bg-white bg-opacity-5 text-white p-2 pl-10 w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600"
        required />
    </div>
  </div>
  
  <!-- Contraseña -->
  <div class="mb-1">
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <input type="password" name="password" placeholder="Password"
        class="bg-white bg-opacity-5 text-white p-2 pl-10 w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600"
        required />
    </div>
  </div>
  
  <!-- Botón de inicio de sesión -->
  <div class="w-full flex items-center justify-end">
    <button type="submit" id="login-button" 
      class="w-fit border-white border  hover:bg-white/10 text-white font-regular py-2 px-6 rounded-full transition duration-300">
      Iniciar Session
    </button>
  </div>
</form>    

</div>
</div>

    `;
	const participant = container.querySelector("#participant");
	// Crear el div padre

	const players: number = this.context.getGameData().playersCount || 0;
	if (participant && players){
		for (let i:number = 0 ; i < players ;i++) {
      //todo: Si es el i = 0, debe deshabilitarlo y poner el nombre del usuario actual:
      //todo: Si es el i= 1 debe agregar un stroke gradiante y ponerlo como Current User
			const participantDiv = document.createElement('div');
      participantDiv.id = i +"-player";
      if (i == 0)
			  participantDiv.className = "flex flex-row p-[1px] h-[2.5rem] w-[10rem] text-white/30 rounded-xl bg-[linear-gradient(45deg,_#E615F24d,_#1ADEF94d)]";
      if (i == 1)
        participantDiv.className = "flex flex-row p-[1px] h-[2.5rem] w-[10rem] text-white rounded-xl bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)]";
      if (i > 1)
        participantDiv.className = "flex flex-row p-[1px] h-[2.5rem] w-[10rem] text-white rounded-xl bg-white";

      participantDiv.innerHTML = `
      <div class="w-full h-full rounded-xl bg-[#11162F]">
        <button class=" px-1 flex items-center w-full h-full justify-start rounded-xl ${i==0? ``:`hover:bg-white/30`} "> 
						<div id="${i}-player-avatar">
							<img src="default-avatar.png" alt="Avatar" class="w-7 h-7 rounded-full" />
						</div>
						<div>
							<div id="${i}-player-name" class="text-sm font-light">${i}</div>			
						</div>
          </button>
        </div>
			`;
      //Esto esta habilitado para todos y se deshabilitado cuando se haya iniciado session.
      participantDiv.addEventListener('click', () => {
        this.current = i;
        //TODO: cambiar el border cuando haga click debe ponerse igual a i==0 y el anterio current deberia ponerse blanco
      });
			participant.appendChild(participantDiv);
		}
	}

	const loginForm = container.querySelector(
	"#login-form"
	) as HTMLFormElement;

    if (loginForm) {
      loginForm.addEventListener("submit", this.handleLogin.bind(this));
    }
    container.querySelector("#submit")?.addEventListener("click", () => {
   
    });

    return container;
  }
  private async handleLogin(event: Event): Promise<void> {


    event.preventDefault(); // Prevenir el envío del formulario por defecto
    const formData = new FormData(event.target as HTMLFormElement);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const loginData = { username, password };

    const response = await fetch(
      "https://transcendence.42.fr/api/v1/auth/signin",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
        credentials: "include", // Incluir cookies en la solicitud
      }
    );
    if (response.ok) {
      const data = await response.json();
      console.log("Inicio de sesión exitoso:", data);
		this.current++;
      if (this.current > this.totalPlayers) {
        this.context.setState(new StartTournamentState(this.context));
      } else {
        //TODO: Actualizo el estado de la plantilla de Players
      }
    }
  }
  next(): void {}
}

class StartTournamentState implements GameState {
  constructor(private context: GameStarter) {}

  render(): HTMLElement {
    const container = document.createElement("div");
    container.innerHTML = ``;

	this.context.completeGameSetup();
    return container;
  }

  next(): void {}
}
