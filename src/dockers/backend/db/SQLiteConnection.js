import fs from "fs";
import path from "path";
import sqlite3Module from "sqlite3";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlite3 = sqlite3Module.verbose();

export class SQLiteConnection {
  db;
  nameScript;
  constructor(name, nameScript){
	this.nameScript = nameScript;
	const dbPath = path.join(__dirname, "..", "data", name);

	const MAX_RETRIES = 10; // Número máximo de reintentos
    const RETRY_DELAY_MS = 1000; // Retardo entre reintentos en milisegundos (1 segundo)

    let retries = 0;
    const connectDb = () => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error("Error al conectar a la base de datos:", err.message);
          if (err.code === 'SQLITE_BUSY' && retries < MAX_RETRIES) {
            retries++;
            console.log(`Reintentando conexión a la base de datos... (${retries}/${MAX_RETRIES})`);
            setTimeout(connectDb, RETRY_DELAY_MS);
          } else {
            console.error("Fallo definitivo al conectar a la base de datos.");
          }
        } else {
          console.log("Conectado a la base de datos SQLite");
          this.db.serialize(); // <--- Añadido serialize() aquí
        }
      });
    };
    
    connectDb(); // Iniciar el intento de conexión
  }

  executeScript() {
	const initSQL = fs.readFileSync(
	  path.join(__dirname, "..", "tools", this.nameScript),
	  "utf-8"
	);
	this.db.exec(initSQL, (err) => {
	  if (err) {
		console.error("Error al inicializar la base de datos:", err.message);
	  } else {
		console.log("Base de datos inicializada correctamente");
	  }
	});
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

