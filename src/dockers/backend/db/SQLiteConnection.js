import fs from "fs";
import path from "path";
import sqlite3Module from "sqlite3";
import { fileURLToPath } from 'url';

const sqlite3 = sqlite3Module.verbose();

export class SQLiteConnection {
  db;
  nameScript;
  
  constructor(name, nameScript) {
    this.nameScript = nameScript;
    // Usar ruta absoluta consistente con el volumen compartido
    const dbPath = path.join("/var/lib/sqlite", name); 

    const MAX_RETRIES = 10;
    const RETRY_DELAY_MS = 1000;
    const BUSY_TIMEOUT = 15000; // 15 segundos

    let retries = 0;
    
    const connectDb = () => {
      this.db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
          console.error(`Error al conectar a ${dbPath}:`, err.message);
          if ((err.code === 'SQLITE_BUSY' || err.code === 'SQLITE_CANTOPEN') && retries < MAX_RETRIES) {
            retries++;
            console.log(`Reintento ${retries}/${MAX_RETRIES} en ${RETRY_DELAY_MS}ms...`);
            setTimeout(connectDb, RETRY_DELAY_MS);
          } else {
            throw new Error(`No se pudo conectar a la base de datos después de ${MAX_RETRIES} intentos`);
          }
        } else {
          console.log(`Conectado a SQLite en ${dbPath}`);
          // Configurar parámetros para mejor manejo de concurrencia
          this.db.configure("busyTimeout", BUSY_TIMEOUT);
          this.db.exec("PRAGMA journal_mode=WAL;");
          this.db.exec("PRAGMA synchronous=FULL;");
        }
      });
    };
    
    connectDb();
  }

  async executeScript() {
    try {
      const initSQL = fs.readFileSync(
        path.join("/var/lib/sqlite", this.nameScript),
        "utf-8"
      );
      
      await new Promise((resolve, reject) => {
        this.db.exec(initSQL, (err) => {
          if (err) {
            console.error("Error en executeScript:", err);
            reject(err);
          } else {
            console.log("Script SQL ejecutado correctamente");
            resolve();
          }
        });
      });
    } catch (err) {
      console.error("Error al leer/ejecutar script:", err);
      throw err;
    }
  }

  close() {
    this.db.close((err) => {
      if (err) {
        console.error("Error al cerrar la base de datos:", err.message);
      } else {
        console.log("Conexión a la base de datos SQLite cerrada.");
      }
    });
  }

  getDBInstance() {
	return this.db;
  }
}

