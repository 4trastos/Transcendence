import { Component } from '../../utils/component.js';
export class Card extends Component {
    constructor(props) {
        super(props);
        this.props = props;
        this.template = this.renderTemplate();
    }
    renderTemplate() {
        return `
        <div class="backdrop-blur-3xl bg-opacity-15 bg-[#1D1F2B] ${this.props.width} ${this.props.height} border border-white border-opacity-15 rounded-2xl shadow-lg flex flex-col overflow-hidden">
        <!-- Header del chat -->	
        <div id="${this.props.id}-header" class="relative flex justify-center items-center space-x-2 px-4 py-2 text-center text-white text-sm">
        ${this.props.title}
        </div>
        <!-- Divider -->
        <hr id="${this.props.id}-divider"class="w-full border-t border-white border-opacity-15" />

          <div id="${this.props.id}-body" class=" flex-1 overflow-y-auto text-sm  space-y-2">
          </div>

        </div>

    `;
    }
    initEvents() {
        const body = this.element?.querySelector(`#${this.props.id}-body`);
        if (!body)
            return;
        if (this.props.content) {
            body.appendChild(this.props.content.render());
        }
    }
}
export class ChartCard extends Card {
    constructor(props) {
        super(props);
        this.props = props;
        this.body = this.renderBody();
    }
    renderBody() {
        // Aquí puedes crear el cuerpo del card, por ejemplo, un gráfico o una lista
        return `
    <div class="p-4">Este es el cuerpo del card</div>
    `;
    }
}
//# sourceMappingURL=Card.js.map