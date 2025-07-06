import { Chat } from "../../domain/entities/Chat";

export class ChatSingleton  {
	private static instance: ChatSingleton = null;
	private chats: Chat[] = [];

	private constructor() {} // Evita instanciar directamente

	public static  getInstance(): ChatSingleton {
		if (!this.instance) {
			this.instance = new ChatSingleton();
			this.instance.chats = [
				{
					id: "19",
					users: ["adrian3", "3", "2"],
					isGroupChat: true,
					title: "New Group",
					messages:[{
						content: "Hola Chicos, ¿cómo están?" ,
						chatId: "19",
						sender_id: "2"
					},
					{
					  content: "@Adrian! ¿Todavia estas en casa?",
					  chatId: "19",
					  sender_id: "2"
					}]
				},
				{
					id: "2",
					users: ["adrian3", "3"],
					isGroupChat: false,
					title: "New Group",
					messages:[{
						content: "Hola, ¿cómo estás?" ,
						chatId: "2",
						sender_id: "adrian3"
					},
					{
					  content: "Bien, desarrollando un proyecto, tu?",
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
			console.error(`Chat with id ${chatId} not found`);
			return null;
		}
		return chat;
	}

	 async getAllChats(): Promise<Chat[]> {
		return this.chats;
	}
	public async addMessageToChat(chatId: string, message: any): Promise<void> {
		const chat = await this.getChatById(chatId);
		if (!chat) {
			console.error(`Chat with id ${chatId} not found`);
			return;
		}
		chat.messages.push(message);
	}

	 async addChat(chat: Chat): Promise<void> {
		this.chats.push(chat);
	}
	 async updateChat(chatId: string, updatedChat: Chat): Promise<void> {
		const index = this.chats.findIndex(chat => chat.id === chatId);
		if (index === -1) {
			console.error(`Chat with id ${chatId} not found`);
			return ;
		}
		this.chats[index] = updatedChat;
	}
}

