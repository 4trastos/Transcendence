import { User } from "src/domain/entities/User";



export default interface UserRepositoryStore {

	getUserById(userId: string, jwt: string): Promise<User>;
	getAllUsers(): Promise<User[]>;


}