import { ChatRepositoryPort } from "../../application/ports/ChatRepositoryPort";
import { Chat } from "../../domain/entities/Chat";
import { Message } from "../../domain/entities/Message";
import { ChatSingleton } from "../db/ChatSingleton";
import ChatSQLite from "../db/ChatSqlite";


export class ChatRepositoryAdapter implements ChatRepositoryPort {
    private chatSingleton: ChatSingleton;
    private chatSQLite: ChatSQLite;
    constructor(chatSQLite: ChatSQLite) {
        this.chatSQLite = chatSQLite;
        this.init();
    }
    deleteChatById(userId: any): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async saveChat(chat: Chat): Promise<Chat> {
        //await this.chatSingleton.addChat(chat);
        return await this.chatSQLite.addChat(chat);
    }

    async getChatByMember(userIds: string): Promise<Chat[]> {
        const chats = await this.chatSQLite.getChatByUser(userIds);
        if (!chats) {
            throw new Error(`Chat with ID: ${userIds} not found.`);
        }
        return chats;
    }


    private init() {
        this.chatSingleton = ChatSingleton.getInstance();
    }
    
    async saveMessage(chatId: string, message: Message): Promise<Message> {
        await this.chatSQLite.addMessageToChat(chatId, message);
        return message;
        
    }
    async getChatById(chatId: string): Promise<Chat> {
        const chat = await this.chatSQLite.getChatById(chatId);
        if (!chat) {
            throw new Error(`Chat with ID ${chatId} not found.`);
        }
        return chat;
    }

    async getMessages(chatId) {
        return await this.chatSQLite.getChatById(chatId);
    }

    
    async getMessagesByChatId(chatId: string): Promise<Message[]> {
        return (await this.chatSQLite.getChatById(chatId)).messages;
    }
}