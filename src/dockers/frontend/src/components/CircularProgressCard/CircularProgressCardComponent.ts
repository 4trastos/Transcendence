import { Component, ComponentProps } from "../../utils/component";

interface CircularProgressCardProps extends ComponentProps {
	progress: number;
	title: string;
	description: string;
	color?: string;
	colorHint?: string;
}

export class CircularProgressCardComponent extends Component {

  protected props: CircularProgressCardProps;

  constructor(props: CircularProgressCardProps) {
	super(props);
	this.props = props;
	//Hint debe ser un color blanco con 35% de opacidad
	this.props.colorHint = this.props.colorHint || "rgba(255, 255, 255, 0.35)";
	this.props.color = this.props.color || "#FFFFFF";
	this.template = this.renderTemplate();
  }

  renderTemplate() {
	const r = 45;
	const circumference = 2 * Math.PI * r;
	const offset = circumference * (1 - this.props.progress / 100);

	return `
	<div id="${this.props.id}" class="backdrop-blur-3xl bg-opacity-15 bg-[#1D1F2B] w-[18rem] h-[12rem] border border-white border-opacity-15 rounded-2xl shadow-lg flex flex-col overflow-hidden">

	<div id="${this.props.id}-header" class="relative flex justify-center items-center space-x-2 px-4 py-2 text-center text-white text-sm">
		${this.props.title}
		</div>
		<!-- Divider -->
		<hr id="${this.props.id}-divider" class="w-full border-t border-white border-opacity-15" />
		<div class="grid grid-cols-2 gap-x-2 items-center justify-center place-items-center h-full px-2">
			<svg class="w-24 h-24" viewBox="0 0 100 100">
			<circle cx="50" cy="50" r="${r}" stroke="${this.props.colorHint}" stroke-width="6" fill="none"/>
			<circle cx="50" cy="50" r="${r}" 
			stroke="${this.props.color}" 
			stroke-width="6"
			fill="none"
			stroke-dasharray="${circumference}" 
			stroke-dashoffset="${offset}"
			stroke-linecap="round"
			transform="rotate(-90 50 50)"/>
			</svg>
			<div class="flex flex-col justify-start items-start">
				<p class="text-white text-sm">${this.props.contentTitle}</p>
				<p class="text-gray-400 text-xs">${this.props.contentText}</p>
			</div>
		</div>
	</div>
	`;
  }
}