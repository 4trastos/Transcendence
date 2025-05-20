import { Component } from "../../utils/component";
export class Label extends Component {
    constructor(props) {
        super(props);
        this.props = props;
        this.template = this.renderTemplate();
    }
    renderTemplate() {
        return `
      <label
        id= ${this.props.id} 
        class="text-white ${this.props.className || ''}"
      > 
        ${this.props.content}
      </label>
    `;
    }
}
//# sourceMappingURL=Label.js.map