import { ChatRepositoryPort } from "../ports/ChatRepositoryPort";
import { Chat } from "../../domain/entities/Chat";
import { HandleException } from "../../domain/exception/HandleException";
import { UserRepositoryPort } from "../ports/UserRepositoryPort";

export class LoadChatByUserId {
    constructor(private chatRepository: ChatRepositoryPort, private userRepository: UserRepositoryPort) {}

    async execute(userId: string, jwt: string): Promise<Chat[]> {
        return await this.chatRepository.getChatByMember(userId).then(async (chats) => {
            if (!chats)
                throw new HandleException("Chat not found", 404, "Not Found");
            for (const chat of chats) {
                if (chat.isGroupChat) {
                    chat.title = chat.title || "Group Chat";
                } else {
                    const id = chat.users.filter((user) => Number(user) !== Number(userId))[0];
                    console.log(chat.users, userId);
                    if (!id) throw new HandleException("Bad chat configuration, single user", 406, "Not Acceptable");
                    const user = await this.userRepository.getUserById(id, jwt);
                    if (!user) {
                        throw new HandleException("User not found", 404, "Not Found");
                    }
                    console.log(JSON.stringify(user, null, 2))
                    chat.title = user.username || "Private Chat";
                }
            }
            return chats;
        });
    }
}
