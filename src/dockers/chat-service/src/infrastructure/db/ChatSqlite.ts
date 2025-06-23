import { openDb } from './database';
import { Chat } from '../../domain/entities/Chat';
import { Message } from '../../domain/entities/Message';

export default class ChatSqlite {

  private db;
  constructor(db) {
    this.db = db;
  }

  async getChatByUser(user: string): Promise<Chat[]> {
      const rows = await this.db.all(`SELECT ch.*, GROUP_CONCAT(cu.user_id) AS users FROM chats ch JOIN chat_users cu ON cu.chat_id = ch.id WHERE ch.id IN ( SELECT chat_id FROM chat_users WHERE user_id = ?) GROUP BY ch.id`,[user]);

      const chats = rows.map(row => ({
        id: row.id,
        title: row.title,
        isGroupChat: !!row.is_group_chat,
        users: row.users ? row.users.split(',') : []
      }));
      console.log(chats);
    return Promise.all(chats.map(async (chat) => {
      const messages = await this.db.all(`SELECT * FROM messages WHERE chat_id = ?`, [chat.id]);
      return {
        ...chat,
        users: chat.users,
        isGroupChat: !!chat.isGroupChat,
        messages: messages.map(m => ({
          content: m.content,
          chatId: m.chat_id,
          sender_id: m.sender_id
        }))
      };
    }));
  }


  async getAllChats(): Promise<Chat[]> {
    const chats = await this.db.all(`SELECT * FROM chats`);

    return Promise.all(chats.map(async (chat) => {
      const messages = await this.db.all(`SELECT * FROM messages WHERE chat_id = ?`, [chat.id]);
      return {
        ...chat,
        users: JSON.parse(chat.users),
        isGroupChat: !!chat.isGroupChat,
        messages: messages.map(m => ({
          content: JSON.parse(m.content),
          chatId: m.chat_id,
          sender_id: m.sender_id
        }))
      };
    }));
  }

  async getChatById(chatId: string): Promise<Chat> {
  const row = await this.db.get(`
    SELECT ch.*, GROUP_CONCAT(cu.user_id) AS users
    FROM chats ch
    JOIN chat_users cu ON cu.chat_id = ch.id
    WHERE ch.id = ?
    GROUP BY ch.id
  `, [chatId]);

    if (!row) throw new Error(`Chat with id ${chatId} not found`);
    const chat = row ? {
          ...row,
          users: row.users ? row.users.split(',') : []
        } : null;
    const messages = await this.db.all(`SELECT * FROM messages WHERE chat_id = ?`, [chatId]);

    return {
      ...chat,
      users: chat.users,
      isGroupChat: !!chat.isGroupChat,
      messages: messages.map(m => ({
        content: m.content,
        chatId: m.chat_id,
        sender_id: m.sender_id
      }))
    };
  }

  async addChat(chat: Chat): Promise<void> {

    const result = await this.db.run(
      `INSERT INTO chats (title, is_group_chat) VALUES (?, ?)`,
      [chat.title, chat.isGroupChat]
    );
    const chatId = result.lastID;

  console.log(JSON.stringify(result, null, 2));
    for (const username of chat.users) {
      const user = await this.db.get(`SELECT id FROM users WHERE username = ?`, [username]);
      if (user) {
        await this.db.run(`INSERT INTO chat_users (chat_id, user_id) VALUES (?, ?)`, [chatId, user.id]);
      }
    }
    for (const msg of chat.messages) {
      await this.db.run(
        `INSERT INTO messages (chat_id, sender_id, content) VALUES (?, ?, ?)`,
        [chatId, msg.sender_id, msg.content]
      );
    }

  }

  async addMessageToChat(chatId: string, message: Message): Promise<Message> {
    await this.db.run(
      `INSERT INTO messages (chat_id, sender_id, content) VALUES (?, ?, ?)`,
      [chatId, message.sender_id, message.content]
    );
    return message;
  }

  async updateChat(chatId: string, updatedChat: Chat): Promise<void> {
    await this.db.run(
      `UPDATE chats SET users = ?, isGroupChat = ?, title = ? WHERE id = ?`,
      [JSON.stringify(updatedChat.users), updatedChat.isGroupChat ? 1 : 0, updatedChat.title, chatId]
    );
  }
}

