import { Component, ComponentProps } from "../../utils/component";
interface LabelProps extends ComponentProps {
    id: string;
    content: string;
    className?: string;
}
export declare class Label extends Component {
    protected props: LabelProps;
    constructor(props: LabelProps);
    renderTemplate(): string;
}
export {};
