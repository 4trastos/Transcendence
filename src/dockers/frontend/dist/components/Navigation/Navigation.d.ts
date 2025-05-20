import { Component, ComponentProps } from '../../utils/component';
interface NavigationProps extends ComponentProps {
    items: Array<{
        text: string;
        url: string;
        active?: boolean;
    }>;
}
export declare class Navigation extends Component {
    protected props: NavigationProps;
    constructor(props: NavigationProps);
    changeActiveItem(newActiveItem: string): void;
    private renderNavItems;
    renderTemplate(): string;
    update(newProps?: Partial<NavigationProps>): void;
}
export {};
