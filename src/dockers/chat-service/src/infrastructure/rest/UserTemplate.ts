import { User } from "../../domain/entities/User";
import UserRepositoryStore from "./UserRepositoryStore";

class UserTemplate implements UserRepositoryStore {
	private url = process.env.URI_USER_SERVICE || "http://localhost:3010/api/v1/users";

    public constructor() {} // Evita instanciar directamente

	public async getUserById(userId: string): Promise<User> {
		const chat = await fetch(this.url + `/${userId}`);
		if (!chat) {
			throw new Error(`Chat with id ${userId} not found`);
		}
		const user:User = await chat.json();
		return user as unknown as User;
	}

	 async getAllUsers(): Promise<User[]> {
		return [];
	}

	 async addUser(user: User): Promise<void> {
		 await fetch(this.url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(user),
		});
	}
	 async updateUser(userId: string, updatedUser: User): Promise<void> {
		/* const index = this.users.findIndex(user => user.id === userId);
		if (index === -1) {
			throw new Error(`Chat with id ${userId} not found`);
		}
		this.users[index] = updatedUser; */
		await fetch(this.url + `/${userId}`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(updatedUser),
		});
	}
}

export default UserTemplate;
