import { ChatRepositoryPort } from "../ports/ChatRepositoryPort";
import { Message } from "../../domain/entities/Message";
import { HandleException } from "../../domain/exception/HandleException";
import { Chat } from "../../domain/entities/Chat";

export default class LoadMessage {
    private chatRepository: ChatRepositoryPort;
    private 
    constructor(chatRepository: ChatRepositoryPort) {
        this.chatRepository = chatRepository
    }

    /**
     * 
     * @param userId User ID of the user requesting the messages
     * @param chatId chatId of the chat to load messages from
     * @throws Error if the user does not have access to the chat or if no chat is found for the user
     * @returns 
     */
    async execute(userId: string, chatId: string): Promise<Message[]> {
        return await this.chatRepository.getChatByMembers([userId]).then((chats) => {
            if (chats.length === 0) {
                throw new HandleException("No chat found for the user", 404, "Not Found");
            }
            const chat:Chat = chats.find((chat) => chat.id === chatId);
            if (!chat) {
                throw new HandleException("User does not have access to this chat", 403, "Forbidden");
            }
            return chat.messages;
        });
    }
}
