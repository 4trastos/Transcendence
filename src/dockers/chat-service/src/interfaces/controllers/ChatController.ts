import { FastifyReply } from "fastify";
import LoadMessage from "../../application/use-cases/LoadMessage";
import { LoadChat } from "../../application/use-cases/LoadChat";
import { LoadChatByUserId } from "../../application/use-cases/LoadChatByUserId";
import { Chat } from "../../domain/entities/Chat";
import { SaveChat } from "../../application/use-cases/SaveChat";
import { FastifyRequest } from "fastify/types/request";

interface ChatParams {
    chatId: string;
}
interface ChatByIdParams {
    userId: string;
}

export class ChatController {
    private getMessages: LoadMessage;
    private getChat: LoadChat;
    private getChatById: LoadChatByUserId;
    private saveChat: SaveChat;
    constructor(getMessages: LoadMessage, getChat: LoadChat, getChatById: LoadChatByUserId, saveChat: SaveChat) {
        this.getMessages = getMessages;
        this.getChat = getChat;
        this.getChatById = getChatById;
        this.saveChat = saveChat;
    }

    async postChat(req: FastifyRequest<{Body: Chat}>, reply:FastifyReply) {
        const chat:Chat= req.body;
        await this.saveChat.execute(chat);
        reply.send({});
    }
    async getMessagesHandler(req: FastifyRequest<{Params: ChatParams}>, reply: FastifyReply) {
        const decoded:{ id:string, user:string, roles: string[] } =  await req.jwtVerify();

        const chatId = req.params.chatId as string;
        const messages = await this.getMessages.execute(decoded.id, chatId);
        reply.send(messages);

    }
    
    async getChatHandler(req: FastifyRequest<{Params: ChatParams}>, reply: FastifyReply) {
        const decoded:{ user:string, roles: string[] } =  await req.jwtVerify();

        const chatId = req.params.chatId as string;
        const chat = await this.getChat.execute(decoded.user, chatId);
        reply.send(chat);

    }
    async getChatsByIdHandler(req: FastifyRequest<{ Params: ChatByIdParams}>, reply: FastifyReply) {
        const decoded:{id:string, user:string, roles: string[] } =  await req.jwtVerify();
            
        console.log("Token: " + req.cookies.token);
        const chat = await this.getChatById.execute(decoded.id, req.cookies.token);
        reply.send(chat);
    }

}
