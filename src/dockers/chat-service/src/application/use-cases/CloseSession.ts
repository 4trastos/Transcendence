import { SessionRepositoryPort } from "../ports/SessionRepositoryPort";


export default class CloseSession {
	private sessionRepository: SessionRepositoryPort;
		constructor(sessionRepository: SessionRepositoryPort) {
			this.sessionRepository = sessionRepository;
		}
	
		async execute(connection:any, req:any, onStatusChange: (req:any, status: string) => void): Promise<void> {
			connection.on('close', () => {
				this.sessionRepository.deleteSessionById(req.headers['x-user-id']);
				onStatusChange(req,"close");
				connection.close();
			});
		};
}