import { Component, ComponentProps } from "../../utils/component";

interface LabelProps extends ComponentProps {
  id         : string
  content    : string
  className? : string
}

export class Label extends Component {
  protected props: LabelProps;

  constructor(props: LabelProps) {
    super(props);
    this.props = props;
    this.template = this.renderTemplate();
  }

  renderTemplate() {
    return `
      <label
        id= ${ this.props.id } 
        class="text-white ${this.props.className || ''}"
      > 
        ${ this.props.content }
      </label>
    `;
  }
}
