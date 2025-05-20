import Message from "../../data/Message";
import { Component, ComponentProps } from "../../utils/component";
interface FloatingChatProps extends ComponentProps {
    id: string;
    title: string;
    messages?: Message[];
    currentUser?: string;
    currentUserAvatar?: string;
    chatAvatar?: string;
    isGroup?: boolean;
    onlineUser?: Map<string, boolean>;
    onExit: () => void;
    onSendMessage?: (message: string) => void;
}
export declare class FloatingChatComponent extends Component {
    protected props: FloatingChatProps;
    constructor(props: FloatingChatProps);
    changeStatus(userId: string, newStatus: boolean): void;
    updateStatus(): void;
    renderTemplate(): string;
    protected initEvents(): void;
}
export {};
