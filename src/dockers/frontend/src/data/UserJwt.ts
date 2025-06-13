
export class UserJwt {
	id?:string;
	user: string;
	roles?: string[];
	constructor(user: string, roles: string[]) {
		this.user = user;
		this.roles = roles;
	}
	toString() {
		return JSON.stringify(this, null, 2);
	}
}