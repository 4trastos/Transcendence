export default class Message {
    chatId: string;
    content: {
        text: string;
    };
    avatarUrl?: string;
    sender_id: string;
    constructor(chatId: string, content: {
        text: string;
    }, sender_id: string);
}
