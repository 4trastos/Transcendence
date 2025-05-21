import { SessionRepositoryPort } from "../ports/SessionRepositoryPort";
import { WebSocketUser } from "./ListenMessage";



export default class BroadcastConnectionStatus {
	private sessionRepository: SessionRepositoryPort;
	constructor(sessionRepository: SessionRepositoryPort) {
		this.sessionRepository = sessionRepository;
	}

	async execute(req:any, status: string): Promise<void> {
		const userId:{ user:string, roles: string[] } = await req.jwtVerify();
		const sessions = await this.sessionRepository.getSessions();
		if (sessions) {
			sessions.forEach((session: WebSocketUser) => {
				if (session.user.contacts.includes(userId.user)) {
					session.websocket.send(JSON.stringify({ chatId:null, menssage:null, userId: userId.user, status: status }));
				}
			});
		}
	};
}