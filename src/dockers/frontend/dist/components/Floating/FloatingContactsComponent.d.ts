import { Chat } from "../../data/Chat";
import { Component, ComponentProps } from "../../utils/component";
interface FloatingChatListProps extends ComponentProps {
    chats?: Chat[];
    owner?: string;
    onClick?: (chatId: string) => void;
}
export default class FloatingChatListComponent extends Component {
    protected props: FloatingChatListProps;
    constructor(props: FloatingChatListProps);
    changeStatus(chatId: string, newStatus: boolean): void;
    renderTemplate(): string;
    protected initEvents(): void;
}
export {};
