import { openDb } from './database';
import { Chat } from '../../domain/entities/Chat';
import { Message } from '../../domain/entities/Message';

class ChatRepository {
  async getAllChats(): Promise<Chat[]> {
    const db = await openDb();
    const chats = await db.all(`SELECT * FROM chats`);
    
    return Promise.all(chats.map(async (chat) => {
      const messages = await db.all(`SELECT * FROM messages WHERE chatId = ?`, [chat.id]);
      return {
        ...chat,
        users: JSON.parse(chat.users),
        isGroupChat: !!chat.isGroupChat,
        messages: messages.map(m => ({
          content: JSON.parse(m.content),
          chatId: m.chatId,
          sender_id: m.sender_id
        }))
      };
    }));
  }

  async getChatById(chatId: string): Promise<Chat> {
    const db = await openDb();
    const chat = await db.get(`SELECT * FROM chats WHERE id = ?`, [chatId]);

    if (!chat) throw new Error(`Chat with id ${chatId} not found`);

    const messages = await db.all(`SELECT * FROM messages WHERE chatId = ?`, [chatId]);

    return {
      ...chat,
      users: JSON.parse(chat.users),
      isGroupChat: !!chat.isGroupChat,
      messages: messages.map(m => ({
        content: JSON.parse(m.content),
        chatId: m.chatId,
        sender_id: m.sender_id
      }))
    };
  }

  async addChat(chat: Chat): Promise<void> {
    const db = await openDb();
    await db.run(
      `INSERT INTO chats (id, users, isGroupChat, title) VALUES (?, ?, ?, ?)`,
      [chat.id, JSON.stringify(chat.users), chat.isGroupChat ? 1 : 0, chat.title]
    );
  }

  async addMessageToChat(chatId: string, message: Message): Promise<Message> {
    const db = await openDb();
    await db.run(
      `INSERT INTO messages (chatId, sender_id, content) VALUES (?, ?, ?)`,
      [chatId, message.sender_id, JSON.stringify(message.content)]
    );
    return message;
  }

  async updateChat(chatId: string, updatedChat: Chat): Promise<void> {
    const db = await openDb();
    await db.run(
      `UPDATE chats SET users = ?, isGroupChat = ?, title = ? WHERE id = ?`,
      [JSON.stringify(updatedChat.users), updatedChat.isGroupChat ? 1 : 0, updatedChat.title, chatId]
    );
  }
}

export default new ChatRepository();
