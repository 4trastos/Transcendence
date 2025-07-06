

 export default class Message {
	chatId:string;
	content: string;
	avatarUrl?:string;
	sender_id: string;

	constructor(
		chatId: string,
		content: string,
		sender_id: string
	) {
		this.chatId = chatId;
		this.content = content;
		this.sender_id = sender_id;
	}
}