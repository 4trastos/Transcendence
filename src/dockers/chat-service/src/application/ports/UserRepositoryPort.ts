import { User } from "../../domain/entities/User";



export interface  UserRepositoryPort {
    getUserById(userID: string): Promise<User>;
    getUsers() : Promise<User[]>;
    saveUser(chat: User): Promise<void>;
}
