import { Component, ComponentProps } from "../../utils/component";

export interface MatchGameComponentProps extends ComponentProps {
  onDestroy: ()=>void;
  players: [string, string];
}

export class MatchGameComponent extends Component {
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

