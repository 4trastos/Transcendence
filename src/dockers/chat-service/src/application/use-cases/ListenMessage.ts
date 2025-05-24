import { HandleException } from "../../domain/exception/HandleException";
import { Chat } from "../../domain/entities/Chat";
import { Message } from "../../domain/entities/Message";
import { User } from "../../domain/entities/User";
import { ChatRepositoryPort } from "../ports/ChatRepositoryPort";
import { SessionRepositoryPort } from "../ports/SessionRepositoryPort";


export interface WebSocketUser {
    user: User;
    websocket: any;
}

export class ListenMessage {
	private chatRepository: ChatRepositoryPort;
	private sessionRepositoryPort: SessionRepositoryPort;
	constructor(chatRepository: ChatRepositoryPort, sessionRepositoryPort: SessionRepositoryPort) {
		this.chatRepository = chatRepository;
		this.sessionRepositoryPort = sessionRepositoryPort;
	}

	async execute(connection:any, req: any, onStatusChange: (req:any, status:string)=>void): Promise<void> {

	   connection.on('message', async (message) => {
		const decoded:{ user:string, roles: string[] } =  await req.jwtVerify();
		let userId = decoded.user;
			if (!userId) {
				console.log("No estas autorizado para conectarte, create una cuenta");
				onStatusChange(req,"close");
				connection.close();
				throw new HandleException("No se tiene permiso para la conexion", 401, "Unauthorized");
			}
			const msg_json: Message = JSON.parse(message.toString());
			let chat: Chat | undefined;
			try {
				chat = await this.chatRepository.getChatById(msg_json.chatId);
				if (!chat) {
					console.log("El chat no existe", msg_json.chatId);
					connection.send(JSON.stringify({error: "El chat no existe"}));
					return ;
				}
				//Comprobar si la session sera un ID de seguridad como JWT o simplemente un ID de usuario
				const wsUsr: WebSocketUser = await this.sessionRepositoryPort.getSessionByUserId(userId);
				if (!wsUsr) {
					console.log("El usuario no tiene acceso", userId);
					onStatusChange(req,"close");
					connection.close();
					return;
				}
				if (!chat.users.includes(wsUsr.user.id)) {
					connection.send(JSON.stringify({error: "No tienes acceso para enviar mensajes a este chat"}))
					return ;
				}
			}
			catch (error) {
				console.error("Error al obtener el chat: ", error);
				connection.send(JSON.stringify({error: "El chat no existe"}));
				return ;
			}
			if (chat == undefined) {
				console.log("El chat no existe");
				connection.send(JSON.stringify({error: `El chatId ${msg_json.chatId} no existe,`}))
				return ;
			} else {
				msg_json.created_at = new Date();
				await this.chatRepository.saveMessage(msg_json.chatId, msg_json);
			}
			try {
				console.log(`Enviando mensaje: ${msg_json.content.text}`);
				this.chatMessage(userId, chat, msg_json.content.text);
			} catch (error) {
				console.error("Error al enviar el mensaje: ", error);
				connection.send(JSON.stringify({error: "Error al enviar el mensaje"}));
				return ;
			}
			//this.broadcastMessage(null, msg_json.content.text.toString());
		});
	}

	
	
	async chatMessage(userId:string, chat: Chat, text:string): Promise<void> {
		if (chat.users.length > 0) {
			const sessions = await this.sessionRepositoryPort.getSessions();
			if (sessions.length > 0) {
				sessions.forEach(client => {
					if (userId == client.user.id) 
						console.log("No se envia el mensaje al usuario que lo envio", userId);
					else if (client.user == null)
						throw Error("No se guardo el cliente en la session");
					else if (chat.users.includes(client.user.id) && client.websocket.readyState === 1)
						client.websocket.send(JSON.stringify({chatId: chat.id, message: text }));
				});
			}
		} else
			console.log("Error no hay usuarios");
	}
}