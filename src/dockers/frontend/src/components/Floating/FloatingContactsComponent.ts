import { Chat } from "../../data/Chat";
import { SummaryUser, User } from "../../data/User";
import { Component, ComponentProps } from "../../utils/component";
import { ToastService } from "../../utils/toast";




interface ItemChatProps extends ComponentProps {
	name: string;
	lastMessage: string;
	avatar?: string;
	isGroupChat?: boolean;
	online?: boolean | null;
	onClick: () => void;
}

class ChatItemComponent extends Component {
	protected props: ItemChatProps;
	constructor(props: ItemChatProps) {
		super(props);
		this.props = props;
		this.template = this.renderTemplate();
	}

	updateStatus(online: boolean) {
		const itemStatus = this.element?.querySelector('#chat-item-status') as HTMLElement;
		if (!itemStatus) return;
		itemStatus.classList.toggle('bg-green-500', online);
		itemStatus.classList.toggle('bg-red-500', !online);
	}

	renderTemplate() {
		return `
	<div class="flex justify-center w-full"> 
      <div class="flex w-full max-w-md overflow-hidden min-w-0 items-center space-x-3 py-3 px-4 hover:bg-white hover:bg-opacity-5 cursor-pointer">
      <div class="flex-shrink-0">
        <img src="${this.props.avatar}" alt="${this.props.name}" class="w-7 h-7 rounded-full object-cover">
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-white font-regular text-sm">${this.props.name}</p>
        <p 
		class="text-gray-400 text-xs font-ligth truncate"
		>${this.props.lastMessage}</p>
      </div>
      <div class="flex-shrink-0 self-center">
        ${!this.props.isGroupChat ? `<div id="chat-item-status" class="w-1.5 h-1.5 aspect-square rounded-full "></div>` : ''}
      </div>
    </div></div>
	`;
	}

	protected initEvents(): void {
		if (!this.element) return;

		this.updateStatus(this.props.online || false);
		this.element.addEventListener("click", () => {
			this.props.onClick();
		});
	}
}


interface SuggestionItemProps extends ComponentProps {
	username: string;
	hasFriend: boolean;
	avatar?: string;
	onAdded: () => void;
	onOpenChat: () => void;
}
class SuggestionItemComponent extends Component {
	protected props: SuggestionItemProps;
	constructor(props: SuggestionItemProps) {
		super(props);
		this.props = props;
		this.template = this.renderTemplate();
	}

	updateStatus(online: boolean) {
		const itemStatus = this.element?.querySelector('#chat-item-status') as HTMLElement;
		if (!itemStatus) return;
		itemStatus.classList.toggle('bg-green-500', online);
		itemStatus.classList.toggle('bg-red-500', !online);
	}

	renderTemplate() {
		return `
	<div class="flex justify-center w-full"> 
		<div class="flex w-full max-w-md overflow-hidden min-w-0 items-center space-x-3 py-3 px-4 hover:bg-white hover:bg-opacity-5 cursor-pointer">
			<div class="flex-shrink-0">
				<img src="${this.props.avatar}" alt="${this.props.username}" class="w-7 h-7 rounded-full object-cover">
			</div>
			<div class="flex-1 min-w-0">
				<p class="text-white font-regular text-sm">${this.props.username}</p>
			</div>
			<div class="flex-shrink-0 self-center">
			${this.props.hasFriend ? `
				<button id="add-friend-${this.props.username}" 
					class="ripple bg-transparent border border-white text-white text-sm py-2 px-6 rounded-full hover:bg-white/10 transition">
					<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-5 w-5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
					</svg>
				</button>
				` : `
				<button id="send-message-${this.props.username}" 
					class="ripple bg-transparent border border-white text-white text-sm py-2 px-6 rounded-full hover:bg-white/10 transition">
					<svg 
						xmlns="http://www.w3.org/2000/svg" 
						fill="none"
						viewBox="0 0 24 24"
							stroke="currentColor" 
							class="h-5 w-5">
					<path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
					</svg>
				</button>
				` }
			</div>
		</div>
	</div>
	`;
	}

	protected initEvents(): void {
		if (!this.element) return;

		this.updateStatus(this.props.online || false);
		this.element.querySelector(`#add-friend-${this.props.username}`)?.addEventListener("click", () => {
			this.props.onAdded();
		});
		this.element.querySelector(`#send-message-${this.props.username}`)?.addEventListener("click", () => {
			this.props.onOpenChat();
		});
	}
}


interface FloatingChatListProps extends ComponentProps {
	chats?: Chat[];
	suggestions?: SummaryUser[];
	owner?: string;
	onClick?: (chatId: string) => void;
}
export default class FloatingChatListComponent extends Component {
	protected props: FloatingChatListProps;
	constructor(props: FloatingChatListProps) {
		super(props);
		this.props = props;
		this.template = this.renderTemplate();
	}
	changeStatus(chatId: string, newStatus: boolean) {
		const chatItem = this.element?.querySelector(`#chat-${chatId}`) as HTMLElement;
		if (!chatItem) return;
		const status = chatItem.querySelector('#chat-item-status') as HTMLElement;
		if (!status) return; //Si es un chat grupal no hay status
		status.classList.toggle('bg-green-500', newStatus);
		status.classList.toggle('bg-red-500', !newStatus);

	}

	renderTemplate() {
		return `

<div class="rounded-lg h-fit w-fit px-[5px] bg-gradient-animate shadow-[0_0_20px_rgba(0,0,0,0.5)]">

	<div id="contacts" class=" shadow-black shadow-xl bg-[#11162F] bottom-4 right-4 w-[18rem] h-[33rem] rounded-lg  flex flex-col overflow-hidden z-50">
		<!-- Encabezado -->
		<div id="list-header" class="relative flex p-4 border-b border-white items-center border-opacity-10">
			<h2 class="text-white text-sm font-ligth">Amigos</h2>
		</div>

		<!-- Lista -->
		<div id="contacts-content" class="items-center px-5 pb-3 flex flex-col space-y-4"> 
			<div id="chat-list" class="h-fit w-full overflow-y-auto mb-4 rounded-2xl bg-white bg-opacity-10"></div>
			<div id="suggestion-list" class="h-fit w-full overflow-y-auto mb-4 rounded-2xl bg-white bg-opacity-10"></div>
		</div>
	</div>
</div>
	`;
	}

	
	protected initEvents(): void {
		if (!this.element) return;
		const chatList = this.element.querySelector('#chat-list') as HTMLElement;
		const suggestionsItem = this.element.querySelector('#suggestion-list') as HTMLElement;
		const chatLength = this.props.chats?.length || 0;
		this.props.chats?.forEach((chat: Chat, index) => {
			const chatItem = new ChatItemComponent({
				name: chat.title,
				lastMessage: chat.messages[chat.messages.length - 1].content,
				avatar: chat.avatarUrl || '',
				isGroupChat: chat.isGroupChat,
				online: true,
				onClick: () => {
					this.props.onClick?.(chat.id);
				}
			});

			chatList.appendChild(chatItem.render());
			if (index < chatLength - 1) {
				const hr = document.createElement('hr') as HTMLElement;
				hr.classList.add('border-t', 'border-white', 'border-opacity-15');
				chatList.appendChild(hr);
			}
		});
		this.props.suggestions?.forEach((summaryUser: SummaryUser, index) => {

			const suggestionItem = new SuggestionItemComponent({
				username: summaryUser.username,
				avatar: summaryUser.avatar,
				hasFriend: summaryUser.hasFriend,
				onAdded: () => {
					this.addFriend(summaryUser.username, () => {
						suggestionItem.update({hasFriend:true});
					})
				},
				onOpenChat: () => {
					//TODO: creo el chat
					this.createChat(summaryUser.username, () => {
						suggestionItem.update({hasFriend:true});
					})
				}
			});

		});
		const header = this.element?.querySelector(
			`#list-header`
		) as HTMLElement;
		if (!header) return;

		header.addEventListener("click", () => {
			const chatItem = header.closest(`#contacts`) as HTMLElement;

			if (!chatItem) return;

			chatItem.classList.toggle("h-[33rem]");
			chatItem.classList.toggle("h-fit");
			chatItem
				.querySelector(`#contacts-content`)
				?.classList.toggle("hidden");
		});
	}
	async createChat(username: string, update: () => void) {
		try {
			const response = await fetch('https://localhost:8443/chats/chats', {
				method: 'POST',
				credentials: "include",
				body: JSON.stringify({users: [username], isGroupChat: false})
			});

			if (response.ok) {
				const body = await response.json();
				update();
				this.props.onClick?.(body.id);

			} else {
				ToastService.show("Error al intentar crear el chat con " + username, "error");	
			}
		} catch (err) {
			ToastService.show("Intenta crear un chat en otro momento", "error");	
		}
	}
	async addFriend(username: string, update: () => void) {
		try {
			const  response = await fetch('http://localhost:3000/api/friends/' + username, {
				method: 'POST',
				credentials: "include"
			});
			if (response.ok) {

				ToastService.show(`Se añadio a ${username} a la lista de amigos`, "success");
			} else {
				ToastService.show("Error al intentar añadir a " + username, "error");
			}
		} catch (err) {
			ToastService.show("Intenta crear un chat en otro momento", "error");
		} 
	}
}