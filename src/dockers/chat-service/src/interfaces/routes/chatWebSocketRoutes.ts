
import { ChatRepositoryAdapter } from "../../infrastructure/repositories/ChatRepositoryAdapter";
import { UserRepositoryAdapter } from "../../infrastructure/repositories/UserRepositoryAdapter";
import { ChatWebSocketController } from "../controllers/ChatWebSocketController";
import { ListenMessage } from "../../application/use-cases/ListenMessage";
import CloseSession from "../../application/use-cases/CloseSession";
import { SessionRepositoryAdapter } from "../../infrastructure/repositories/SessionRepositoryAdapter";
import VerifyConnection from "../../application/use-cases/VerifyConnection";
import UserRepositoryStore from "../../infrastructure/rest/UserRepositoryStore";
import { FastifyInstance } from "fastify/types/instance";
import ChatSqlite from "../../infrastructure/db/ChatSqlite";

export default async function chatWebSocketRoutes(fastify: FastifyInstance, data: {userTemplate: UserRepositoryStore, db:any}) {
    const listenMessage = new ListenMessage(new ChatRepositoryAdapter(new ChatSqlite(data.db)), new SessionRepositoryAdapter());
    const userRepository = new UserRepositoryAdapter(data.userTemplate);
    const sessionRepository = new SessionRepositoryAdapter();
    const closeSession = new CloseSession(sessionRepository);
    const verifyConnection = new VerifyConnection(userRepository, sessionRepository);
    const chatWSController = new ChatWebSocketController(listenMessage, closeSession, verifyConnection, sessionRepository);
    //fastify.register(fastifyWebsocket);

    fastify.get('/api/v1/chats/connect-ws',{
        websocket: true,
        schema: {
          summary: 'WebSocket Chat Connection',
          description: 'Este endpoint establece una conexión WebSocket con el servidor para chats en tiempo real.',
          tags: ['chat-ws'],
          response: {
            101: {
              description: 'Switching Protocols (WebSocket handshake)',
            },
          }
        }
      }, chatWSController.handleConnection.bind(chatWSController));
}