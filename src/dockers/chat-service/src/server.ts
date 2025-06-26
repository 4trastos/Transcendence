import chatRoutes from "./interfaces/routes/chatRoutes";
import fastifyWebsocket from "@fastify/websocket";
import configApp from "./app.config";
import UserTemplate from "./infrastructure/rest/UserTemplate";
import chatWebSocketRoutes from "./interfaces/routes/chatWebSocketRoutes";
import fs from "fs";
import { open, Database } from 'sqlite';
import path from "path";
import sqlite3 from 'sqlite3';




async function configDB(): Promise<Database> {
	const dbPath = '/var/lib/sqlite/sqlite.db';

	const db = await open({
		filename: dbPath,
		driver: sqlite3.Database,
	});

	// Ejecuta el SQL de inicialización si es necesario
	const initSQL = fs.readFileSync(path.join(__dirname, '..', 'tools', 'init.sql'), 'utf-8');
	await db.exec(initSQL);

	console.log('Base de datos conectada e inicializada correctamente');

	return db;
}

async function main() {
	const fastify = await configApp();

	const dbInstance = await configDB();
	// Instancia del adaptador WebSocket
	fastify.register(fastifyWebsocket);
	fastify.register(chatWebSocketRoutes, {userTemplate: new UserTemplate(),db: dbInstance});
	fastify.register(chatRoutes, {userTemplate: new UserTemplate(), db: dbInstance});

	fastify.listen({ port: 3050, host: '0.0.0.0' }, (err:any, address:any) => {
		if (err) {
			dbInstance.close();
			fastify.log.error(err);
			process.exit(1);
		}
		console.log(`🚀 Servidor WebSocket corriendo en ${address}`);
	});
	process.on('SIGINT', () => {
        dbInstance.close();
        console.log('Conexión a SQLite cerrada');
        fastify.close(() => {
            process.exit();
        });
        process.exit();
    });
}

main();