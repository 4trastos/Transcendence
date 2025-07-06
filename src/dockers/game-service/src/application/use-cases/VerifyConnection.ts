import { User } from "../../domain/entities/User";
import { UserRepositoryPort } from "../ports/UserRepositoryPort";

export default class VerifyConnection {
	private userRepository: UserRepositoryPort;
	constructor( userRepository: UserRepositoryPort) {
		this.userRepository = userRepository;
	}
	
	async execute(connection:any, req:any, onStatusChange: (req:any, status: string) => void): Promise<User> {
		const decoded:{ id:string, user: string, roles: string[] } =  await req.jwtVerify();
		let userId = decoded.id;
		if (!decoded.id) {
			onStatusChange(req,"close");
			connection.close();
			return;
			//throw new HandleException("El usuario no es correcto", 401, "Unauthorized");
		}
		const user:User | undefined = await this.userRepository.getUserById(userId, req.cookies.token);
		console.log("userId: " + userId,"user: "+ JSON.stringify(user, null, 2));
		if (!user) {
			console.log("No estas autorizado para conectarte, create una cuenta");
			onStatusChange(req,"close");
			connection.close();
			return;
			//throw new HandleException("No se tiene permiso para la conexion", 401, "Unauthorized");
		}
		const wsUser = ({ user: user, websocket: connection });
		//connection.send(JSON.stringify({ message: `Conexión establecida, userId: ${user.id}`}));
		onStatusChange(req,"open");
		return user;
	}
}