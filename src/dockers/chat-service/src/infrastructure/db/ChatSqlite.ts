import { openDb } from './database';
import { Chat } from '../../domain/entities/Chat';
import { Message } from '../../domain/entities/Message';
import { HandleException } from '../../domain/exception/HandleException';

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

  async addChat(chat: Chat): Promise<Chat> {

    console.log(chat);

    const userIds = await Promise.all(chat.users.map(username => 
      this.db.get(`SELECT id FROM users WHERE username = ?`, [username])
  ));

    const userIdsList = userIds.map(user => user?.id).filter(id => id !== undefined);
    
    if (userIdsList.length !== chat.users.length) {
      throw new HandleException("Algunos usuarios no existen", 404);
    }



    const chatExist = await this.db.get(
      `
      SELECT c.id
      FROM chats c
      JOIN chat_users cu ON c.id = cu.chat_id
      WHERE cu.user_id IN (${userIdsList.map(() => '?').join(', ')})
      GROUP BY c.id
      HAVING COUNT(DISTINCT cu.user_id) = ?
      `,
      [...userIdsList, userIdsList.length]
    );

    if (chatExist) throw new HandleException("Ya existe un chat para estos usuarios", 409);
 
    const result = await this.db.run(
      `INSERT INTO chats (title, is_group_chat) VALUES (?, ?)`,
      [chat.title, chat.isGroupChat]
    );
    const chatId = result.lastID;

    console.log(JSON.stringify(result, null, 2));
    const userInsertPromises = userIdsList.map(userId =>
      this.db.run(`INSERT INTO chat_users (chat_id, user_id) VALUES (?, ?)`, [chatId, userId])
    );
    await Promise.all(userInsertPromises);

    if (chat.messages) {
      const messageInsertPromises = chat.messages.map(msg =>
        this.db.run(
          `INSERT INTO messages (chat_id, sender_id, content) VALUES (?, ?, ?)`,
          [chatId, msg.sender_id, msg.content]
        )
      );
      await Promise.all(messageInsertPromises);
    }
    return {
      id: chatId,
      users: userIdsList,
      isGroupChat: chat.isGroupChat
    };
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

