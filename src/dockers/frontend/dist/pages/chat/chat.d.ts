import { Chat } from "../../data/Chat";
import { Component } from "../../utils/component";
export declare class ChatPage extends Component {
    private socket;
    private activeChat;
    private userId;
    constructor();
    protected initEvents(): void;
    private loadChats;
    renderChatList(chats: Chat[]): void;
    private openChat;
    private handleMessage;
    private sendMessage;
}
