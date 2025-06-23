
import LoadMessage from "../../application/use-cases/LoadMessage";
import { ChatRepositoryAdapter } from "../../infrastructure/repositories/ChatRepositoryAdapter";
import { ChatController } from "../controllers/ChatController";
import { LoadChat } from "../../application/use-cases/LoadChat";
import { LoadChatByUserId } from "../../application/use-cases/LoadChatByUserId";
import { chatDtoSchema, chatDtoSchemaArray, chatDtoSchemaArrayResponse } from "../../domain/entities/Chat";
import { messageDtoSchemaArray, messageDtoSchemaArrayResponse } from "../../domain/entities/Message";
import roleGuard from "../guards/RoleGuard";
import { UserRepositoryAdapter } from "../../infrastructure/repositories/UserRepositoryAdapter";
import UserRepositoryStore from "../../infrastructure/rest/UserRepositoryStore";
import { FastifyInstance } from "fastify/types/instance";
import ChatSqlite from "../../infrastructure/db/ChatSqlite";
import { SaveChat } from "../../application/use-cases/SaveChat";


const postChatSchema = {
  body: {
    type: 'object',
    required: ['id', 'users', 'messages', 'isGroupChat', 'title'],
    properties: {
      id: { type: 'string' },
      users: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
      },
      isGroupChat: { type: 'boolean' },
      title: { type: 'string' },
      messages: {
        type: 'array',
        items: {
          type: 'object',
          required: ['sender_id', 'content', 'chatId'],
          properties: {
            sender_id: { type: 'string' },
            content: { type: 'string' },
            chatId: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
};


export default async function chatRoutes(fastify: FastifyInstance, data: {userTemplate: UserRepositoryStore, db:any}) {
    const messageRepo = new ChatRepositoryAdapter(new ChatSqlite(data.db));
	const userRepository = new UserRepositoryAdapter(data.userTemplate);
    const getMessages = new LoadMessage(messageRepo);
    const getChatById = new LoadChatByUserId(messageRepo, userRepository);
	const saveChat = new SaveChat(messageRepo)
    const getChat = new LoadChat(messageRepo);
    const chatController = new ChatController(getMessages, getChat, getChatById, saveChat);

    fastify.get("/api/v1/chats/:chatId/messages", {
		//preHandler: roleGuard(['view', 'admin'], userRepository),
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
		//preHandler: roleGuard(['view', 'admin'], userRepository),
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

    fastify.get("/api/v1/chats/user",{
		//preHandler: roleGuard(['view', 'admin'], userRepository),
		schema: {
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


	  fastify.post('/api/v1/chats', {schema: postChatSchema},  chatController.postChat.bind(chatController));
    //fastify.get('/chats/connect-ws', { websocket: true }, chatController.handleWebSocketConnection.bind(chatController));
}