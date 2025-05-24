import { WebSocketUser } from "../use-cases/ListenMessage";

export interface SessionRepositoryPort {
	getSessionByUserId(sessionId: string): Promise<WebSocketUser>;
	getSessions(): Promise<WebSocketUser[]>;
	saveSession(userId: string, wsUser: WebSocketUser): Promise<WebSocketUser>;
	deleteSessionById(userId: string): Promise<void>;
	updateSession(session: any): Promise<void>;
}