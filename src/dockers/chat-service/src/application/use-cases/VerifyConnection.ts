import { HandleException } from "../../domain/exception/HandleException";
import { User } from "../../domain/entities/User";
import { SessionRepositoryPort } from "../ports/SessionRepositoryPort";
import { UserRepositoryPort } from "../ports/UserRepositoryPort";
import { WebSocketUser } from "./ListenMessage";

export default class VerifyConnection {
	private userRepository: UserRepositoryPort;
	private sessionRepository: SessionRepositoryPort;
	constructor( userRepository: UserRepositoryPort, sessionRepository: SessionRepositoryPort) {
		this.userRepository = userRepository;
		this.sessionRepository = sessionRepository;
	}
	
	async execute(connection:any, req:any, onStatusChange: (req:any, status: string) => void): Promise<void> {
        const decoded:{ user: string, roles: string[] } =  await req.jwtVerify();
		let userId = decoded.user;
		if (!decoded.user) {
			onStatusChange(req,"close");
			connection.close();
			throw new HandleException("El usuario no es correcto", 401, "Unauthorized");
		}
		const user:User | undefined = await this.userRepository.getUserById(userId);
		if (!user) {
			console.log("No estas autorizado para conectarte, create una cuenta");
			onStatusChange(req,"close");
			connection.close();
			throw new HandleException("No se tiene permiso para la conexion", 401, "Unauthorized");
		}
		const wsUser:WebSocketUser = ({ user: user, websocket: connection });
		await this.sessionRepository.saveSession(userId, wsUser).then((ws) => {
			console.log("Se guardo la session", ws.user.id);
		});
		connection.send(JSON.stringify({ message: `Conexión establecida, userId: ${user.id}`}));
		onStatusChange(req,"open");
	}
}