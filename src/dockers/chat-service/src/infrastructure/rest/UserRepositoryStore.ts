import { User } from "src/domain/entities/User";



export default interface UserRepositoryStore {

	getUserById(userId: string): Promise<User>;
	getAllUsers(): Promise<User[]>;

	addUser(user: User): Promise<void>;
	updateUser(userId: string, updatedUser: User): Promise<void>;

}