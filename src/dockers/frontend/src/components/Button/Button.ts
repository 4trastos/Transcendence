import { Component, ComponentProps } from '../../utils/component';

interface ButtonProps extends ComponentProps {
  text: string;
  onClick?: () => void;
}

export class Button extends Component {
  protected props: ButtonProps;

  constructor(props: ButtonProps) {
    super(props);
    this.props = props;
    this.template = `<button class="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors">
  {{ text }}
</button>`;
  }

  protected initEvents(): void {
    if (this.props.onClick && this.element) {
      this.element.addEventListener('click', this.props.onClick);
    }
  }
}
