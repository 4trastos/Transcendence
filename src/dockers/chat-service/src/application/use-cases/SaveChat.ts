import { ChatRepositoryPort } from "../ports/ChatRepositoryPort";
import { Chat } from "../../domain/entities/Chat";
import { HandleException } from "../../domain/exception/HandleException";

export class SaveChat {
    constructor(private chatRepository: ChatRepositoryPort) {}

    async execute(chat: Chat): Promise<void> {
        return await this.chatRepository.saveChat(chat);
    }
}
