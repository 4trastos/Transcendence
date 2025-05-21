import { Chat } from "../../domain/entities/Chat";
import { Message } from "../../domain/entities/Message";



export interface  ChatRepositoryPort {
	deleteChatById(arg0: any): Promise<void>;
    saveMessage(chatId, message): Promise<Message>;
    saveChat(chat: Chat): Promise<void>;
    getMessages(chatId);
    getChatById(chatId: string): Promise<Chat>;
    getChatByMembers(userIds: string[]): Promise<Chat[]>;
    getMessagesByChatId(chatId: string): Promise<Message[]>;
}
