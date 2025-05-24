import { UserRepositoryPort } from "../../application/ports/UserRepositoryPort";
import { Chat } from "../../domain/entities/Chat";
import { Message } from "../../domain/entities/Message";
import { User } from "../../domain/entities/User";
import ChatSingleton from "../db/ChatSingleton";
import UserRepositoryStore from "../rest/UserRepositoryStore";
import UserTemplate from "../rest/UserTemplate";


export class UserRepositoryAdapter implements UserRepositoryPort {
    constructor(private userTemplate: UserRepositoryStore) {
    }

    
    getUsers(): Promise<User[]> {
        return this.userTemplate.getAllUsers();
    }


    async saveUser(user: User): Promise<void> {
        await this.userTemplate.addUser(user);
    }

    async getAllUsers(userIds: string[]): Promise<User[]> {
        const users = await this.userTemplate.getAllUsers();
        if (users.length <= 0) {
            throw new Error(`User with ID ${userIds} not found.`);
        }
        return users;
    }



    async getUserById(userId: string): Promise<User> {
        const user:User = await this.userTemplate.getUserById(userId);
        if (!user) {
            throw new Error(`user with ID ${userId} not found.`);
        }
        return user;
    }

}