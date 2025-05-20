import { Component, ComponentProps } from '../../utils/component';
export interface ChatItemProps extends ComponentProps {
    id: string;
    title: string;
    isActive: boolean;
    isGroupChat: boolean;
    lastMessage?: string;
    lastMessageTime?: string;
    unreadCount?: number;
    avatarUrl?: string;
    onClick: (id: string) => void;
}
export declare class ChatItem extends Component {
    protected props: ChatItemProps;
    constructor(props: ChatItemProps);
    private getInitials;
    protected initEvents(): void;
}
