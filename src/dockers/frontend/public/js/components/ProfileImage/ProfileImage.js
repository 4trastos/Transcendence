import { Component } from "../../utils/component.js";
export class ProfileImage extends Component {
    constructor(props) {
        super(props);
        this.props = props;
        this.template = this.renderTemplate();
    }
    renderTemplate() {
        const size = this.props.size || 160;
        return `
      <img 
        src="${this.props.src}" 
        alt="${this.props.alt || 'Image'}" 
        style="width: ${size}px; height: ${size}px;"
        class="rounded-full object-cover ${this.props.className || ''}"
      />
    `;
    }
}
//# sourceMappingURL=ProfileImage.js.map