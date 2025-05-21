import { User } from '../../../src/domain/entities/User';
import { afterEach, beforeEach, describe, expect, it } from '../../../test/builder/test.builder';
import { FastifyInstance } from 'fastify';
import UserRepositoryStore from "../../../src/infrastructure/rest/UserRepositoryStore";
import configApp from '../../../src/app.config';
import chatRoutes from '../../../src/interfaces/routes/chatRoutes';

class MockUserRepository implements UserRepositoryStore {
	getUserById(userId: string): Promise<User> {
		if (userId === '1')
			return Promise.resolve({
				id: "1",
				name: "string",
				contacts: [
					{
						sender_id: "string",
						receiver_id: "string"
					}
				]
			});
		return null;
	}
	getAllUsers(): Promise<User[]> {
		throw new Error('Method not implemented.');
	}
	addUser(user: User): Promise<void> {
		throw new Error('Method not implemented.');
	}
	updateUser(userId: string, updatedUser: User): Promise<void> {
		throw new Error('Method not implemented.');
	}

}

 
describe('auth signIn test', async () => {
	let app: FastifyInstance = null;
	let jwt = null;

	await beforeEach(async () =>{
		app = await configApp();
		jwt = app.jwt.sign({ user: "1", roles: ["view"] }, { expiresIn: "1h" });

		app.register(chatRoutes, new MockUserRepository());
		await app.ready();
	});

	await it('should return 200 valid chatId and Jwt', async () => {

		const response = await app.inject({
			method: 'GET',
			url: `/chats/${1}/messages`,
			headers: {
				'Authorization':'Bearer ' + jwt,
			}
		});
		expect(response.statusCode).toBe(200);

	});


	await afterEach(async ()=> {
		await app.close();
	});

});
