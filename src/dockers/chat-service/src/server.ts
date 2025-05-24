import chatRoutes from "./interfaces/routes/chatRoutes";
import fastifyWebsocket from "@fastify/websocket";
import configApp from "./app.config";
import UserTemplate from "./infrastructure/rest/UserTemplate";
import chatWebSocketRoutes from "./interfaces/routes/chatWebSocketRoutes";

async function main() {
	const fastify = await configApp();

	// Instancia del adaptador WebSocket
	fastify.register(fastifyWebsocket);
	fastify.register(chatWebSocketRoutes, new UserTemplate());
	fastify.register(chatRoutes, new UserTemplate());


	fastify.listen({ port: 3000, host: '0.0.0.0' }, (err, address) => {
		if (err) {
			fastify.log.error(err);
			process.exit(1);
		}
		console.log(`🚀 Servidor WebSocket corriendo en ${address}`);
	});
}

main();