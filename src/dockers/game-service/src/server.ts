import fastifyWebsocket from "@fastify/websocket";
import configApp from "./app.config";
import UserTemplate from "./infrastructure/rest/UserTemplate";
import chatWebSocketRoutes from "./interfaces/routes/gameWebSocketRoutes";
import fs from "fs";
import path from "path";



async function main() {
	const fastify = await configApp();

	// Instancia del adaptador WebSocket
	fastify.register(fastifyWebsocket);
	fastify.register(chatWebSocketRoutes, {userTemplate: new UserTemplate()});

	fastify.listen({ port: 3050, host: '0.0.0.0' }, (err:any, address:any) => {
		if (err) {
			fastify.log.error(err);
			process.exit(1);
		}
		console.log(`🚀 Servidor WebSocket corriendo en ${address}`);
	});
	process.on('SIGINT', () => {
        console.log('Conexión a SQLite cerrada');
        fastify.close(() => {
            process.exit();
        });
        process.exit();
    });
}

main();