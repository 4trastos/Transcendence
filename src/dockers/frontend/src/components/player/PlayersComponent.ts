import { Component, ComponentProps } from "../../utils/component";

export interface PlayersPros extends ComponentProps {
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


export class PlayersComponent extends Component {
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


