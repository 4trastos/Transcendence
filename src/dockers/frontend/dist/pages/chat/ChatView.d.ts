import { Component } from "../../utils/component";
export default class ChatView extends Component {
    private socket;
    private userId;
    private currentAvatarUrl;
    private floatingChats;
    private chatMembers;
    private chats;
    constructor(userId: string, currentAvatarUrl: string);
    renderTemplate(): string;
    protected initEvents(): Promise<void>;
    private handleMessage;
    private loadChats;
    private buildChat;
    private sendMessage;
}
