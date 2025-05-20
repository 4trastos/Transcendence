import { Component, ComponentProps } from "../../utils/component";
interface CircularProgressCardProps extends ComponentProps {
    progress: number;
    title: string;
    description: string;
    color?: string;
    colorHint?: string;
}
export declare class CircularProgressCardComponent extends Component {
    protected props: CircularProgressCardProps;
    constructor(props: CircularProgressCardProps);
    renderTemplate(): string;
}
export {};
