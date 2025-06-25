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

	this.db = new sqlite3.Database(dbPath, (err) => {
	  if (err) {
		console.error("Error al conectar a la base de datos:", err.message);
	  } else {
		console.log("Conectado a la base de datos SQLite");
		this.db.serialize(); // <--- Añadido serialize() aquí
	  }
	});
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
  getDBInstance() {
	return this.db;
  }
}

