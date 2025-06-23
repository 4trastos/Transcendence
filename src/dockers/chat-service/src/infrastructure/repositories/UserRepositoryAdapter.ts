import { deprecate } from "util";
import { UserRepositoryPort } from "../../application/ports/UserRepositoryPort";
import { Chat } from "../../domain/entities/Chat";
import { Message } from "../../domain/entities/Message";
import { User } from "../../domain/entities/User";
import UserRepositoryStore from "../rest/UserRepositoryStore";
import UserTemplate from "../rest/UserTemplate";
import { HandleException } from "../../domain/exception/HandleException";


export class UserRepositoryAdapter implements UserRepositoryPort {
    constructor(private userTemplate: UserRepositoryStore) {
    }

    

    getUsers(): Promise<User[]> {
        return this.userTemplate.getAllUsers();
    }


    async getAllUsers(userIds: string[]): Promise<User[]> {
        const users = await this.userTemplate.getAllUsers();
        if (users.length <= 0) {
           console.log(`user with ID ${userIds} not found`);
            //throw new HandleException(`User with ID ${userIds} not found.`, 400);
        }
        return users;
    }

    async getUserById(userId: string, jwt: string): Promise<User> {
        const user:User = await this.userTemplate.getUserById(userId, jwt);
        if (!user) {
           console.log(`user with ID ${userId} not found`);
           // throw new HandleException(`user with ID ${userId} not found.`, 400);
        }
        return user;
    }

}