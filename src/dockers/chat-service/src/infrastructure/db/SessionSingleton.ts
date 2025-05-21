import { HandleException } from "../../domain/exception/HandleException";
import { WebSocketUser } from "../../application/use-cases/ListenMessage";

class SessionSingleton  {
	private static instance: SessionSingleton = null;
	private sessions: Map<string, WebSocketUser> = new Map<string, WebSocketUser>();

	private constructor() {}

	public static  getInstance(): SessionSingleton {
		if (!this.instance) {
			this.instance = new SessionSingleton();
		}
		return this.instance;
	}
	public async addSession(userId: string, wsUser: WebSocketUser): Promise<WebSocketUser> {
		this.sessions.set(wsUser.user.id, wsUser);
		return wsUser;
	}

	public async deleteSessionByUserId(userId: string) {
		this.sessions.delete(userId);
		return ;
	}

	public async getWSUserById(userId: string): Promise<WebSocketUser> {
		const wsUser: WebSocketUser = this.sessions.get(userId);
		return wsUser;
	}

	 async getAllSession(): Promise<WebSocketUser[]> {
		let response:WebSocketUser[] = []; 
		this.sessions.forEach((session: WebSocketUser) => {
			response.push(session);
		});
		return response;
	}

}

export default SessionSingleton;
