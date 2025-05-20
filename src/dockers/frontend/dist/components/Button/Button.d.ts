import { Component, ComponentProps } from '../../utils/component';
interface ButtonProps extends ComponentProps {
    text: string;
    onClick?: () => void;
}
export declare class Button extends Component {
    protected props: ButtonProps;
    constructor(props: ButtonProps);
    protected initEvents(): void;
}
export {};
