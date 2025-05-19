import { Component } from '../../utils/component.js';
export class Button extends Component {
    constructor(props) {
        super(props);
        this.props = props;
        this.template = `<button class="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors">
  {{ text }}
</button>`;
    }
    initEvents() {
        if (this.props.onClick && this.element) {
            this.element.addEventListener('click', this.props.onClick);
        }
    }
}
//# sourceMappingURL=Button.js.map