import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Abre conexión
export function openDb() {
  return open({
    filename: './chat.db',
    driver: sqlite3.Database
  });
}
