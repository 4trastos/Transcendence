import { User } from "../../domain/entities/User";
import UserRepositoryStore from "./UserRepositoryStore";

class UserTemplate implements UserRepositoryStore {
	private url = process.env.URI_USER_SERVICE || "http://app:3000/api/profile";

    public constructor() {} // Evita instanciar directamente

	public async getUserById(userId: string, jwt:string): Promise<User> {
		const body = await fetch(this.url + `/${userId}`, {
			headers: {
				Cookie: `token=${jwt}`
			}
		});
		if (!body) {
			throw new Error(`user with id ${userId} not found`);
		}
		const user:{status: string, data: User} = await body.json();
		return user.data as unknown as User;
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
