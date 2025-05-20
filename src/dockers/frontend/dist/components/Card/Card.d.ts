import { Component, ComponentProps } from '../../utils/component';
export interface CardProps extends ComponentProps {
    id: string;
    title: string;
    width?: string;
    height?: string;
    content?: Component;
}
export declare class Card extends Component {
    protected props: CardProps;
    constructor(props: CardProps);
    renderTemplate(): string;
    protected initEvents(): void;
}
interface ChartCardProps extends CardProps {
}
export declare class ChartCard extends Card {
    protected body: string;
    protected props: ChartCardProps;
    constructor(props: ChartCardProps);
    renderBody(): string;
}
export {};
