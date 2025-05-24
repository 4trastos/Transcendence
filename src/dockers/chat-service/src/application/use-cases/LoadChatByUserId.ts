import { ChatRepositoryPort } from "../ports/ChatRepositoryPort";
import { Chat } from "../../domain/entities/Chat";
import { HandleException } from "../../domain/exception/HandleException";
import { UserRepositoryPort } from "../ports/UserRepositoryPort";

export class LoadChatByUserId {
    constructor(private chatRepository: ChatRepositoryPort, private userRepository: UserRepositoryPort) {}

    async execute(jwtUserId: string, userId: string): Promise<Chat[]> {
        if (jwtUserId !== userId)
            throw new HandleException("Unauthorized access to chat data", 403, "Unauthorized");
        return await this.chatRepository.getChatByMembers([userId]).then((chats) => {
            if (!chats)
                throw new HandleException("Chat not found", 404, "Not Found");
            chats.forEach((chat) => {
                if (chat.isGroupChat){
                    chat.title = chat.title || "Group Chat";
                } else {
                    const id = chat.users.find((user) => user !== userId);
                    if (!id) throw new HandleException("Bad chat configuration, single user", 406, "Not Acceptable");
                    this.userRepository.getUserById(id).then((user) => {
                        if (!user) throw new HandleException("User not found", 404, "Not Found");
                        chat.title = user.name || "Private Chat";
                    });
                }
            });
            return chats;
        });
    }
}
