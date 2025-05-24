
import LoadMessage from "../../application/use-cases/LoadMessage";
import { ChatRepositoryAdapter } from "../../infrastructure/repositories/ChatRepositoryAdapter";
import { FastifyInstance } from "fastify";
import { ChatController } from "../controllers/ChatController";
import { LoadChat } from "../../application/use-cases/LoadChat";
import { LoadChatByUserId } from "../../application/use-cases/LoadChatByUserId";
import { chatDtoSchema, chatDtoSchemaArray, chatDtoSchemaArrayResponse } from "../../domain/entities/Chat";
import { messageDtoSchemaArray, messageDtoSchemaArrayResponse } from "../../domain/entities/Message";
import roleGuard from "../guards/RoleGuard";
import { UserRepositoryAdapter } from "../../infrastructure/repositories/UserRepositoryAdapter";
import UserRepositoryStore from "../../infrastructure/rest/UserRepositoryStore";

export default async function chatRoutes(fastify: FastifyInstance, userRepositoryStore: UserRepositoryStore) {
    const messageRepo = new ChatRepositoryAdapter();
	const userRepository = new UserRepositoryAdapter(userRepositoryStore);
    const getMessages = new LoadMessage(messageRepo);
    const getChatById = new LoadChatByUserId(messageRepo, userRepository);

    const getChat = new LoadChat(messageRepo);
    const chatController = new ChatController(getMessages, getChat, getChatById);

    fastify.get("/api/v1/chats/:chatId/messages", {
		preHandler: roleGuard(['view', 'admin'], userRepository),
		schema: {
		  params: {
            type: 'object',
            properties: {
              chatId: { type: 'string' },
            },
            required: ['chatId'],
          },
		  response: {
			200: messageDtoSchemaArray,
		  },
		  summary: 'Get messages by chatId',
		  tags: ['chat'],
		  security: [
			{
			  bearerAuth: [],
			},
		  ],
		},
	  },chatController.getMessagesHandler.bind(chatController));
    fastify.get("/api/v1/chats/:chatId",{
		preHandler: roleGuard(['view', 'admin'], userRepository),
		schema: {
		  params: {
            type: 'object',
            properties: {
              chatId: { type: 'string' },
            },
            required: ['chatId'],
          },
		  response: {
			200: chatDtoSchema,
		  },
		  summary: 'Get messages by chatId',
		  tags: ['chat'],
		  security: [
			{
			  bearerAuth: [],
			},
		  ],
		},
	  } ,chatController.getChatHandler.bind(chatController));
    fastify.get("/api/v1/chats/user/:userId",{
		preHandler: roleGuard(['view', 'admin'], userRepository),
		schema: {
		  params: {
            type: 'object',
            properties: {
                userId: { type: 'string' },
            },
            required: ['userId'],
          },
		  response: {
			200: chatDtoSchemaArray,
		  },
		  summary: 'Get messages by chatId',
		  tags: ['chat'],
		  security: [
			{
			  bearerAuth: [],
			},
		  ],
		},
	  }, chatController.getChatsByIdHandler.bind(chatController));
    //fastify.get('/chats/connect-ws', { websocket: true }, chatController.handleWebSocketConnection.bind(chatController));
}