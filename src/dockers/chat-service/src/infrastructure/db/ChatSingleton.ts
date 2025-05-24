import { Message } from "../../domain/entities/Message";
import { Chat } from "../../domain/entities/Chat";

class ChatSingleton  {
	private static instance: ChatSingleton = null;
	private chats: Chat[] = [];

	private constructor() {} // Evita instanciar directamente

	public static  getInstance(): ChatSingleton {
		if (!this.instance) {
			this.instance = new ChatSingleton();
			this.instance.chats = [
				{
					id: "1",
					users: ["1", "3", "2"],
					isGroupChat: true,
					title: "New Group",
					messages:[{
						content: { text: "Hola Chicos, ¿cómo están?" },
						chatId: "1",
						sender_id: "2"
					},
					{
					  content: {
						text: "@Adrian! ¿Todavia estas en casa?"
					  },
					  chatId: "1",
					  sender_id: "2"
					}]
				},
				{
					id: "2",
					users: ["1", "3"],
					isGroupChat: false,
					title: "New Group",
					messages:[{
						content: { text: "Hola, ¿cómo estás?" },
						chatId: "2",
						sender_id: "1"
					},
					{
					  content: {
						text: "Bien, desarrollando un proyecto, tu?"
					  },
					  chatId: "2",
					  sender_id: "3"
					}]
				}
			];
		}
		return this.instance;
	}

	public async getChatById(chatId: string): Promise<Chat> {
		const chat = this.chats.find(chat => chat.id === chatId);
		if (!chat) {
			throw new Error(`Chat with id ${chatId} not found`);
		}
		return chat;
	}

	 async getAllChats(): Promise<Chat[]> {
		return this.chats;
	}
	public async addMessageToChat(chatId: string, message: Message): Promise<Message> {
		const chat = await this.getChatById(chatId);
		if (!chat) {
			throw new Error(`Chat with id ${chatId} not found`);
		}
		chat.messages.push(message);
		return message;
	}

	 async addChat(chat: Chat): Promise<void> {
		this.chats.push(chat);
	}
	 async updateChat(chatId: string, updatedChat: Chat): Promise<void> {
		const index = this.chats.findIndex(chat => chat.id === chatId);
		if (index === -1) {
			throw new Error(`Chat with id ${chatId} not found`);
		}
		this.chats[index] = updatedChat;
	}
}

export default ChatSingleton;
