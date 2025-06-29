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
	updateFriendStatus(online: boolean) {
		const itemFriendStatus = this.element?.querySelector(`#suggestion-btn-${this.props.username}`) as HTMLElement;
		if (!itemFriendStatus) return;
		itemFriendStatus.innerHTML = '';
		itemFriendStatus.classList.toggle('bg-red-500', !online);
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
			<div id="suggestion-btn-${this.props.username}" class="flex-shrink-0 self-center">
			${!this.props.hasFriend ? `
				<button id="add-friend-${this.props.username}" 
					class="ripple bg-transparent border border-white text-white text-sm p-2 rounded-full hover:bg-white/10 transition">
						<svg  version="1.1" id="Capa_1" 
							viewBox="0 0 309.059 309.059" xml:space="preserve" class="h-3 w-3">
						<g>
							<g>
								<path style="fill:#FFFFFF;" d="M280.71,126.181h-97.822V28.338C182.889,12.711,170.172,0,154.529,0S126.17,12.711,126.17,28.338
									v97.843H28.359C12.722,126.181,0,138.903,0,154.529c0,15.621,12.717,28.338,28.359,28.338h97.811v97.843
									c0,15.632,12.711,28.348,28.359,28.348c15.643,0,28.359-12.717,28.359-28.348v-97.843h97.822
									c15.632,0,28.348-12.717,28.348-28.338C309.059,138.903,296.342,126.181,280.71,126.181z"/>
							</g>
						</g>
						</svg>
				</button>
				` : `
				<button id="send-message-${this.props.username}" 
					class="ripple bg-transparent border border-white text-white text-sm p-2 rounded-full hover:bg-white/10 transition">
					<svg 
						xmlns="http://www.w3.org/2000/svg" 
						fill="none"
						stroke="#FFFFFF" 
						viewBox="0 0 24 24"
							stroke="currentColor" 
							class="h-3 w-3">
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

	<div id="contacts" class=" shadow-black shadow-xl bg-[#11162F] bottom-4 right-4 w-[18rem] h-[33rem] space-y-4 rounded-lg  flex flex-col overflow-hidden z-50">
		<!-- Encabezado -->
		<div id="list-header" class="relative flex p-4 border-b border-white items-center border-opacity-10">
			<h1 class="text-white text-sm font-ligth">Contactos</h1>
		</div>

		<!-- Lista -->
		<div id="messages-content" class="items-start px-5 pb-3 flex flex-col space-y-2"> 
			<h2 class="text-white text-sm font-ligth">Mensajes</h2>
			<div id="chat-list" class="h-fit w-full overflow-y-auto mb-4 rounded-2xl bg-white bg-opacity-10"></div>
		</div>
		<div id="suggestions-content" class="items-start px-5 pb-3 flex flex-col space-y-2"> 
			<h2 class="text-white text-sm font-ligth">Sugerencias</h2>
			<div id="suggestion-list" class="h-fit w-full overflow-y-auto mb-4 rounded-2xl bg-white bg-opacity-10 space-y-1"></div>
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
			try {
				const chatItem = new ChatItemComponent({
					name: chat.title,
					lastMessage: chat.messages.length !== 0  ? chat.messages[chat.messages.length - 1].content: "",
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
			} catch (err) {
				console.error("No se pudo crear el item",  err);
			}

		});


		this.props.suggestions?.forEach((summaryUser: SummaryUser, index) => {

			try {
				const suggestionComponent = new SuggestionItemComponent({
					username: summaryUser.username,
					avatar: summaryUser.avatar,
					hasFriend: summaryUser.hasFriend,
					onAdded: () => {
						this.addFriend(summaryUser.username, () => {
							suggestionComponent.update({hasFriend:true});
						})
					},
					onOpenChat: () => {
						//TODO: creo el chat
						this.createChat(summaryUser.username, () => {
							suggestionComponent.update({hasFriend: true});
						})
					}
				});
				suggestionsItem.appendChild(suggestionComponent.render());
	
			} catch (err) {
				console.error("No se pudo crear el item",  err);
			}
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
				.querySelector(`#messages-content`)
				?.classList.toggle("hidden");
			chatItem
				.querySelector(`#suggestions-content`)
				?.classList.toggle("hidden");
		});
	}



	async createChat(username: string, update: () => void) {
		try {
			const response = await fetch('https://localhost:8443/chats/', {
				method: 'POST',
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
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
			const  response = await fetch('https://localhost:8443/backend/api/friends/' + username, {
				method: 'POST',
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({})
			});
			if (response.ok) {
				update();
				ToastService.show(`Se añadio a ${username} a la lista de amigos`, "success");
			} else {
				ToastService.show("Error al intentar añadir a " + username, "error");
			}
		} catch (err) {
			ToastService.show("Intenta crear un chat en otro momento", "error");
		} 
	}
}