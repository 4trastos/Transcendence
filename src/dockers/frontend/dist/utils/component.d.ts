export interface ComponentProps {
    id?: string;
    className?: string;
    [key: string]: any;
}
export declare abstract class Component {
    protected element: HTMLElement | null;
    protected props: ComponentProps;
    protected template: string;
    constructor(props?: ComponentProps);
    protected loadTemplate(path: string): Promise<string>;
    render(): HTMLElement;
    protected processTemplate(): string;
    protected initEvents(): void;
    update(newProps?: Partial<ComponentProps>): void;
}
export declare function mount(component: Component, container: HTMLElement | string): void;
