import { ChatRepositoryPort } from "../ports/ChatRepositoryPort";
import { Chat } from "../../domain/entities/Chat";
import { HandleException } from "../../domain/exception/HandleException";

export class SaveChat {
    constructor(private chatRepository: ChatRepositoryPort) {}

    async execute(chat: Chat): Promise<Chat> {
        if (chat.users.length < 1)
            throw new HandleException("CHat con un unico usuario", 400);
        return await this.chatRepository.saveChat(chat);
    }
}
