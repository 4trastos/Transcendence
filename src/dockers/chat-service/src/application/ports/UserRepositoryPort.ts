import { User } from "../../domain/entities/User";



export interface  UserRepositoryPort {
    getUserById(userID: string): Promise<User>;
    /**
     * 
     * @deprecated
     */
    getUsers() : Promise<User[]>;
}
