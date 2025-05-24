import { ChatRepositoryPort } from "../../application/ports/ChatRepositoryPort";
import { SessionRepositoryPort } from "../../application/ports/SessionRepositoryPort";
import { WebSocketUser } from "../../application/use-cases/ListenMessage";
import { Chat } from "../../domain/entities/Chat";
import { Message } from "../../domain/entities/Message";
import ChatSingleton from "../db/ChatSingleton";
import SessionSingleton from "../db/SessionSingleton";


export class SessionRepositoryAdapter implements SessionRepositoryPort {
    private sessionSingleton: SessionSingleton;

    constructor() {
        this.init();
    }
    getSessionByUserId(sessionId: string): Promise<WebSocketUser> {
        console.log('Verificando existencia de sesión:', sessionId);
        return this.sessionSingleton.getWSUserById(sessionId);
        
    }
    getSessions(): Promise<WebSocketUser[]> {
        return this.sessionSingleton.getAllSession();
    }
    async saveSession(userId: any, wsUser: WebSocketUser): Promise<WebSocketUser> {
        return await this.sessionSingleton.addSession(userId, wsUser);
    }
    deleteSessionById(sessionId: string): Promise<void> {
        this.sessionSingleton.deleteSessionByUserId(sessionId);
        return ;
    }

    updateSession(session: any): Promise<void> {
        throw new Error("Method not implemented.");
    }


    init() {
        this.sessionSingleton = SessionSingleton.getInstance();
    }

}