import { Component, ComponentProps } from "../../utils/component";

export interface ResultGameComponentProps extends ComponentProps {
  onContinue: ()=>void;
  name:string;
  players: string[] | undefined,
  winners: any[] | undefined,
}

export class ResultGameComponent extends Component {
  protected props: ResultGameComponentProps;

  constructor(props:ResultGameComponentProps){
    super();
    this.props = props;
    this.template = this.renderTemplate();
  };

  renderTemplate() {
    return `
    <div class="flex items-center justify-center px-[5px] rounded bg-gradient-animate shadow-[0_0_20px_rgba(0,0,0,0.5)]">
      <div class="flex flex-col space-y-2 bg-[#11162F] p-6 text-white justify-center items-center text-center">
        <h2 >¡WINNER! ${this.props.name}</h2>

        <div class=" space-x-2 flex flex-row justify-center items-center">
          <div class="p-[1px] rounded-full bg-gradient-animate">
            <div class="bg-[#11162F] w-[8rem] h-full rounded-full">PUNTOS: 30</div>
          </div>
        </div>

        <div class="p-[1px]  rounded-full bg-gradient-animate">
            <button id="btn-continue" class="ripple bg-[#11162F] w-[8rem] h-full rounded-full hover:bg-white/30">CONTINUAR</button>
        </div>

      </div>
    </div>
    `;
  };

  protected initEvents() {
    if (!this.element) return;

    const btnContinue = this.element.querySelector('#btn-continue');
    btnContinue?.addEventListener('click', ()=>{
      this.props.onContinue();
      this.destroy();

    });
  }

  protected destroy() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    if (typeof this.props.onDestroy === 'function') {
      this.props.onContinue();
    }
  }
}
