
export class UserJwt {
	id?:string;
	user: string;
	avatar:string;
	roles?: string[];
	constructor(user: string, avatar:string, roles: string[]) {
		this.user = user;
		this.roles = roles;
		this.avatar = avatar;
	}
	toString() {
		return JSON.stringify(this, null, 2);
	}
}