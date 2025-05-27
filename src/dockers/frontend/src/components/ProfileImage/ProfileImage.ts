import { Component, ComponentProps } from "../../utils/component";

interface ProfileImageProps extends ComponentProps {
  src: string;
  alt?: string;
  size?: number;
  className?: string;
}

export class ProfileImage extends Component {
  protected props: ProfileImageProps;

  constructor(props: ProfileImageProps) {
    super(props);
    this.props = props;
    this.template = this.renderTemplate();
  }

  renderTemplate() {
    const size = this.props.size || 160
    return `
      <img 
        src="${this.props.src}" 
        alt="${this.props.alt || 'Image'}" 
        style="width: ${size}rem; height: ${size}rem;"
        class="rounded-full object-cover ${this.props.className || ''}"
      />
    `;
  }
}
