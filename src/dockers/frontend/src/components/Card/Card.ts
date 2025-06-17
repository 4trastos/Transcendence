import { Component, ComponentProps } from "../../utils/component";

export interface CardProps extends ComponentProps {
	id: string;
	title: string;
	width?: string;
	height?: string;
	content?: Component;
}

export class Card extends Component {
	protected props: CardProps;

	constructor(props: CardProps) {
		super(props);
		this.props = props;
		this.template = this.renderTemplate();
	}

	renderTemplate() {
		return `
			<div  class="animate-expand-from-center w-fit h-fit  flex flex-col overflow-hidden px-[5px] rounded bg-gradient-animate shadow-[0_0_20px_rgba(0,0,0,0.5)] ">
				<div  id="${this.props.id}" class="reveal-content backdrop-blur-3xl bg-[#11162F] flex flex-col ${this.props.width} ${this.props.height}  px-[1rem] ">
				<!-- Header del chat -->	
					<div id="${this.props.id}-header" class="reveal-content-child relative flex justify-center items-center space-x-2 px-4 py-2 text-center text-white text-sm">
					${this.props.title}
					</div>
					<div id="${this.props.id}-body" class="reveal-content-child flex-1 overflow-y-auto text-sm  space-y-2">
					</div>
				</div>
			</div>

		`;
	}
	protected initEvents(): void {
		const body = this.element?.querySelector(
			`#${this.props.id}-body`
		) as HTMLElement;
		if (!body) return;
		if (this.props.content) {
			body.appendChild(this.props.content.render());
		}
		setTimeout(() => {
			if (!this.element) return;
			this.element.classList.remove('animate-expand-from-center');
		}, 1000);
	}
}

interface ChartCardProps extends CardProps {}

export class ChartCard extends Card {
	protected body: string;
	protected props: ChartCardProps;

	constructor(props: ChartCardProps) {
		super(props);
		this.props = props;
		this.body = this.renderBody();
	}

	renderBody(): string {
		// Aquí puedes crear el cuerpo del card, por ejemplo, un gráfico o una lista
		return `
		<div class="p-4">Este es el cuerpo del card</div>
		`;
	}
}
