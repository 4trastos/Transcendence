import { Component,ComponentProps } from "../../utils/component"


type Observer = ()=>void;
function reactive<T extends object>(obj: T): [T, {
  subscribe: (observer: Observer) => void,
  clearObservers:()=>void,
  pause: () => void;
  resume: () => void;
  }] {
  const observers = new Set<Observer>();
  let paused = false;

  const proxy = new Proxy(obj, {
    set(target, prop, value) {
      const changed = target[prop as keyof T] !== value;
      target[prop as keyof T] = value;
      if (changed && !paused){
        observers.forEach(cb => cb());
      }
      return true;
    }
  });
  const subscribe = (fn: Observer) => observers.add(fn);
  const clearObservers = () =>{
    observers.clear();
  }
       

  return [proxy, {
    subscribe,
    clearObservers,
    pause: () => { paused = true; },
     resume: () => { paused = false; },
    }
  ];
}



interface GameStarterProps extends ComponentProps {
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
    console.log("Me desuscribo");
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

interface LoginPlayerProps extends ComponentProps {
  onComplete: (data:any) => void;
  onError: (err:any) => void;
  onLoading?: (loading:boolean) => void;
}

class LoginPlayerComponent extends Component{
  protected props: LoginPlayerProps;
  constructor(props:LoginPlayerProps){
    super()
    this.props = props;
    this.template = this.renderTemplate();
  }
  
  renderTemplate() {
    return `
<!-- Contenido encima -->
<div  class="bg-[#11162F] relative z-10 pb-6 ">
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
  </form>`;
  }
  protected initEvents(): void {
    if (!this.element) return;

    const loginForm = this.element.querySelector("#login-form") as HTMLFormElement;
    if (loginForm) {
      loginForm.addEventListener("submit", this.handleLogin.bind(this));
    }
    
  }

    private async handleLogin(event: Event): Promise<void> {
    event.preventDefault(); // Prevenir el envío del formulario por defecto
    const formData = new FormData(event.target as HTMLFormElement);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const loginData = { username, password };

    //La direccion tiene que se la del frontEnd.
    try {
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
        this.props.onComplete(data);  
      } else {
        this.props.onError(null);
      }
    } catch(err) {
        this.props.onError(null);
    }


  }
}


interface PlayersPros extends ComponentProps {
  onSelected: (idx: number ) => void;
  onCompleted:(data:any[])=>void;
  nPlayers:number;
  players:{
    nick:string;
    idx:string;
    avatar?:string;
    hasLogged: boolean;
    isCurrent:boolean;
  }[];
}


class PlayersComponent extends Component {
  protected props: PlayersPros;

  constructor(props: PlayersPros){
    super();
    this.props = props;
    this.template = this.renderTemplate();
  }
  renderTemplate() {
    //TODO: Hay que agregarle un Titulo
    return `
      <div id="list-player" class="space-y-4 p-6 flex flex-col bg-[#11162F]">
      
      </div>
      `;
  }
  protected initEvents(): void {
    if (!this.element) return ;
    const participant = this.element;
    const players: number = this.props.nPlayers;
    if (participant && players){
      this.props.players?.forEach((player, idx) =>{
        const participantDiv = document.createElement('div');
        participantDiv.id = player.idx;
        let className = "flex flex-row p-[1px] h-[2.5rem] w-[10rem] rounded-xl";
        if (player.hasLogged)
          className += " text-white/30  bg-[linear-gradient(45deg,_#E615F24d,_#1ADEF94d)]";
        else if (player.isCurrent)
          className += " text-white  bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)]";
        else
          className += " text-white  bg-white";
        
        participantDiv.className = className;
        participantDiv.innerHTML = `
        <div class="w-full h-full rounded-xl bg-[#11162F]">
          <button id="btn-player-${idx}" ${player.hasLogged? 'disabled=true':''} class=" px-1 flex items-center w-full h-full justify-start rounded-xl ${player.hasLogged? ``:`hover:bg-white/30`} "> 
              <div id="${idx}-player-avatar">
                <img src="${player.avatar}" alt="Avatar" class="w-7 h-7 rounded-full" />
              </div>
              <div>
                <div id="${idx}-player-name" class="text-sm font-light">${player.nick}</div>			
              </div>
            </button>
          </div>
        `;
        //Esto esta habilitado para todos y se deshabilitado cuando se haya iniciado session.
        participantDiv.addEventListener('click', () => {
          if (this.props.players.find(item=>(item.idx==player.idx && item.hasLogged))) return;
          const currentPlayer = this.props.players.find(item=>item.isCurrent);
          
          this.props.players = this.props.players?.map((item) => ({
            ...item,
            isCurrent: item.nick === player?.nick
          }));

          if (currentPlayer) {
            participantDiv?.classList.toggle('bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)]');
            participantDiv?.classList.toggle('bg-white');
            const currentDiv = participant.querySelector(`#${currentPlayer?.idx}`);
            currentDiv?.classList.toggle('bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)]');
            currentDiv?.classList.toggle('bg-white');
          }
          //Cambiar tono de color a ${idx}-player
          this.props.onSelected(idx);
          //this.update();
        });
        participant.appendChild(participantDiv);
      })
    }
  }
  /**
   * 
   * @param data Son los datos del fetch del Usuario en el que debe incluir un nick name del back
   * @returns 
   */
  public updateCurrent(data:any) {
    const currentPlayerIndex = this.props.players.findIndex(item=> item.isCurrent);
    if (currentPlayerIndex < 0) return;
    const currentPlayer = this.props.players[currentPlayerIndex];
    const elementCurrent = this.element?.querySelector('#'+currentPlayer.idx);
    if (!elementCurrent || currentPlayer.hasLogged)return;
    elementCurrent?.classList.toggle('text-white');
    elementCurrent?.classList.toggle('text-white/30');
    elementCurrent?.classList.toggle('bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)]');
    elementCurrent?.classList.toggle('bg-[linear-gradient(45deg,_#E615F24d,_#1ADEF94d)]');
    const btnCurrent = elementCurrent.querySelector('#btn-'+currentPlayer.idx)
    btnCurrent?.classList.toggle('hover:bg-white/30');
    btnCurrent?.setAttribute('disabled','true');

    //Hacer los cambios la memoria y cabiar a current
    this.props.players = this.props.players.map((item)=>({
      ...item,
      isCurrent:item.idx===currentPlayer.idx?false:item.isCurrent,
      hasLogged: item.idx===currentPlayer.idx?true: item.hasLogged
     }));
    const nextPlayer = this.props.players.find(item=>!item.hasLogged);
    if (!nextPlayer) {
      this.props.onCompleted(this.props.players);
      return;
    }
    const elementNext = this.element?.querySelector('#'+nextPlayer.idx);
    if (!elementNext)return;
    elementNext?.classList.toggle('bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)]');
    elementNext?.classList.toggle('bg-white');
    this.props.players = this.props.players.map((item)=>({
      ...item,
      isCurrent:item.idx===nextPlayer.idx?true:item.isCurrent,
     }));
    //Ahora debo cambiarle al DOM de Next Item
  }
}

class LoginPlayersState implements GameState {
  private current = 1;
  private playersComponent:PlayersComponent;
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





/**
 * 1.  debo mostrar quien compite y su grafica, dos estados el inicio de la competicion
 * 2. debo mostrar el final de la competicion
 */
class HandleTournamentState implements GameState {
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
    console.log("Me subscribo");
    this.context.onChange(()=>{
      const matchData:MatchData = this.context.getMatchData();
      if (matchData.status === 'finished') {
        console.log("Players: ", this.players);
        if (matchData.winner) {
          this.nextPlayers?.push(matchData.winner);
          this.context.addWinner(matchData.winner, this.round);
        }
        this.players = this.players?.filter(item=>!matchData.players?.includes(item));
        console.log("Filter-Players: ", matchData.players, this.players);
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
      //TODO: Ya finalizo el Juego, que hacemos? reiniciamos?
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
        this.container.innerHTML= '';
        this.context.completeGameSetup();
      }
    });
    this.container.appendChild(matchGame.render());
  }
  next(): void {
  }
}

interface MatchGameComponentProps extends ComponentProps {
  onDestroy: ()=>void;
  players: [string, string];
}

class MatchGameComponent extends Component {
  protected props: MatchGameComponentProps;

  constructor(props:MatchGameComponentProps){
    super();
    this.props = props;
    this.template = this.renderTemplate();
  };

  renderTemplate() {
    return `
    <div class="flex items-center justify-center px-[5px] rounded bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)] shadow-[0_0_20px_rgba(0,0,0,0.5)]">
      <div class="flex flex-col space-y-2 bg-[#11162F] p-6 text-white justify-center items-center text-center">
        <h2>MATCH</h2>
        <div class="flex justify-center items-center bg-[#11162F] space-x-2 flex flex-row justify-center items-center">
            <div class="flex justify-center items-center bg-[#1ADEF9] p-1 w-[10rem] h-[2.5rem] rounded-xl"> 
              <label>${this.props.players[0]}</label>
            </div>
            <label>Vs</label>
            <div class="flex justify-center items-center bg-[#E615F2] p-1 w-[10rem] h-[2.5rem] rounded-xl"> 
              <label>${this.props.players[1]}</label>
            </div>
        </div>
        
      </div>
      </div>
    `;
  };

  protected initEvents() {
    if (!this.element) return;


    setTimeout(() => {
        this.destroy();
    }, 5000);
  }

  protected destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    if (typeof this.props.onDestroy === 'function') {
      this.props.onDestroy();
    }
  }

}

interface ResultGameComponentProps extends ComponentProps {
  onContinue: ()=>void;
  name:string;
  players: string[] | undefined,
  winners: any[] | undefined,
}
class ResultGameComponent extends Component {
  protected props: ResultGameComponentProps;

  constructor(props:ResultGameComponentProps){
    super();
    this.props = props;
    this.template = this.renderTemplate();
  };

  renderTemplate() {
    return `
    <div class="flex items-center justify-center px-[5px] rounded bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)] shadow-[0_0_20px_rgba(0,0,0,0.5)]">
      <div class="flex flex-col space-y-2 bg-[#11162F] p-6 text-white justify-center items-center text-center">
        <h2 >¡WINNER! ${this.props.name}</h2>

        <div class=" space-x-2 flex flex-row justify-center items-center">
          <div class="p-[1px] rounded-full bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)]">
            <div class="bg-[#11162F] w-[8rem] h-full rounded-full">PUNTOS: 30</div>
          </div>
        </div>

        <div class="p-[1px]  rounded-full bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)]">
            <button id="btn-continue" class="bg-[#11162F] w-[8rem] h-full rounded-full hover:bg-white/30">CONTINUAR</button>
        </div>

      </div>
    </div>
    `;
  };

  protected initEvents() {
    if (!this.element) return;

    const btnContinue = this.element.querySelector('#btn-continue');
    btnContinue?.addEventListener('click', ()=>this.props.onContinue());

  }

}
