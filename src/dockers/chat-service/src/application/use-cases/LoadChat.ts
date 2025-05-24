import { ChatRepositoryPort } from "../ports/ChatRepositoryPort";
import { Chat } from "../../domain/entities/Chat";
import { HandleException } from "../../domain/exception/HandleException";

export class LoadChat {
    constructor(private chatRepository: ChatRepositoryPort) {}

    async execute(userId: string, chatId: string): Promise<Chat> {
        return await this.chatRepository.getChatById(chatId).then((chat) => {
            if (!chat) {
                throw new HandleException("Chat not found", 404);
            }
            if (chat.users.some((userId) => userId === userId)) 
                return chat;
            throw new HandleException("User not found in chat", 404);
        });
    }
}
