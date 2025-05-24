import { ListenMessage, WebSocketUser } from "../../application/use-cases/ListenMessage";
import VerifyConnection from "../../application/use-cases/VerifyConnection";
import CloseSession from "../../application/use-cases/CloseSession";
import BroadcastConnectionStatus from "../../application/use-cases/BroadcastConnectionStatus";
import { SessionRepositoryPort } from "../../application/ports/SessionRepositoryPort";

export class ChatWebSocketController {
    private listenMessage: ListenMessage;
    private closeSession: CloseSession;
    private verifyConnection: VerifyConnection;
    private sessionRepository: SessionRepositoryPort;
    
    constructor(listenMessage :ListenMessage,
         closeSession: CloseSession,
          verifyConnection: VerifyConnection,
           sessionRepository: SessionRepositoryPort) {
        this.listenMessage = listenMessage;
        this.closeSession = closeSession;
        this.verifyConnection = verifyConnection;
        this.sessionRepository = sessionRepository;
    }

    async handleConnection(connection: any, req: any) {
        try {
             this.verifyConnection.execute(connection, req, this.onStatusChange.bind(this));
             this.listenMessage.execute(connection, req, this.onStatusChange.bind(this));

        } catch (error) {
            console.error("Error en la conexión WebSocket:", error);
            connection.send(JSON.stringify({ error: "Error al obtener mensajes" }));
            connection.close();
            throw error;
        } finally {
            this.closeSession.execute(connection, req, this.onStatusChange.bind(this));
        }
    }
    async onStatusChange(req:any, status: string): Promise<void> {
        const userId:{ user:string, roles: string[] } = await req.jwtVerify();
        const sessions: WebSocketUser[] = await this.sessionRepository.getSessions();
        if (sessions) {
            sessions.forEach((session: WebSocketUser) => {
                if (session.user.contacts.includes(userId.user))
                    session.websocket.send(JSON.stringify({ chatId:null, menssage:null, userId: userId.user, status: status }));
            });
        }
    };
}
