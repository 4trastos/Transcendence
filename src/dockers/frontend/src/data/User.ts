import {Connect} from "../data/Connect";

export interface Stat {
	points: number;
	rank: number;
	wins: number;
	losses: number;
}
export class User {
    username: string;
	stats?: Stat;
    contacts?: Connect[];
	constructor(username: string, contacts?: Connect[]) {
		this.username = username;
		this.contacts = contacts;
	}

}