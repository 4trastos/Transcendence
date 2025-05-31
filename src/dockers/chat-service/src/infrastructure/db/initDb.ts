import { openDb } from './database';

async function init() {
  const db = await openDb();

  await db.exec(`
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      users TEXT,
      isGroupChat INTEGER,
      title TEXT
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chatId TEXT,
      sender_id TEXT,
      content TEXT,
      FOREIGN KEY(chatId) REFERENCES chats(id)
    );
  `);
}

init();