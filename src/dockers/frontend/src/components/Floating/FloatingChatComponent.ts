import Message from "../../data/Message";
import { Component, ComponentProps } from "../../utils/component";

interface MessageComponentProps extends ComponentProps {
  text: string;
  lastUpdate?: string;
  currentUser?: boolean;
  avatar?: string;
}
class MessageComponent extends Component {
  protected props: MessageComponentProps;
  constructor(props: MessageComponentProps) {
    super(props);
    this.props = props;
    this.template = this.renderTemplate();
  }

  renderTemplate() {
    this.props.avatar = this.props.avatar || "https://via.placeholder.com/40";

    if (this.props.currentUser === true) {
      return `

	<div id="chat-message" class="flex flex-col gap-4">
		<div class="flex flex-col items-end" >
			<div class="flex items-end gap-2">
				<!-- Burbuja de mensaje -->
				<div class="bg-gray-600 text-white text-xs rounded-t-lg rounded-bl-lg px-4 py-2  max-w-xs">
				${this.props.text}
				</div>
				<!-- Avatar -->
				<img src="${this.props.avatar}" class="w-7 h-7 rounded-full" />
			</div>
			<!-- Hora debajo de la burbuja -->
			<span class="text-xs text-gray-400 mr-10">16:45</span>
		</div>
	</div>

`;
    } else {
      return `
	<div id="chat-message" class="flex flex-col gap-4">
		<div class="flex flex-col items-start" >
			<div class="flex items-end gap-2">
				<!-- Avatar -->
				<img src="${this.props.avatar}" class="w-7 h-7 rounded-full" />
				<!-- Burbuja de mensaje -->
				<div class="bg-gray-700 text-white text-xs rounded-t-lg rounded-br-lg px-4 py-2 max-w-xs">
				${this.props.text}
				</div>
			</div>
			<span class="text-xs text-gray-400 ml-10">16:45</span>
		</div>
	</div>
  `;
    }
  }
}

interface FloatingChatProps extends ComponentProps {
  id: string;
  title: string;
  messages?: Message[];
  currentUser?: string;
  currentUserAvatar?: string;
  chatAvatar?: string;
  isGroup?: boolean;
  onlineUser?: Map<string, boolean>;
  onExit: () => void;
  onSendMessage?: (message: string) => void;
}

export class FloatingChatComponent extends Component {
  protected props: FloatingChatProps;
  constructor(props: FloatingChatProps) {
    super(props);
    this.props = props;
    this.template = this.renderTemplate();
  }

  changeStatus(userId: string, newStatus: boolean) {
    const status = this.props.onlineUser?.get(userId);
    if (status !== undefined) {
      this.props.onlineUser?.set(userId, newStatus);
    }
    this.updateStatus();
  }

  updateStatus() {
	const statusElement = this.element?.querySelector(
        `#${this.props.id}-status`
      ) as HTMLDivElement;
	  let nActive = 0;
	  this.props.onlineUser?.forEach((status: boolean, userId: string) => {
		nActive += status ? 1 : 0;
	  });
	if (this.props.isGroup) {
        statusElement.textContent =
          nActive > 0 ? nActive + " En línea" : "Desconectado";
      } else {
        statusElement.textContent = nActive > 1 ? "En línea" : "Desconectado";}
  }

  renderTemplate() {
    return `
	<div id="${this.props.id}" class=" backdrop-blur-3xl bg-opacity-15 bg-[#1D1F2B] bottom-4 right-4  w-[18rem] h-[22rem]  border border-white border-opacity-15 rounded-2xl shadow-lg flex flex-col overflow-hidden z-50">
	<!-- Header del chat -->	
	<div id="${this.props.id}-header" class="relative flex items-center space-x-2 px-4 py-2  text-white">
		<div id="${this.props.id}-avatar">
			<!-- Aquí puedes poner una imagen o ícono -->
			<img src="${this.props.chatAvatar}" alt="Avatar" class="w-7 h-7 rounded-full" />
		</div>
		
		<div>
			<div id="${this.props.id}-name" class="text-sm font-ligth">${this.props.title}</div>
			<div id="${this.props.id}-status" class="text-gray-400 text-xs"> En línea</div>
			
		</div>

		<div id="${this.props.id}-close" class="absolute center right-2 cursor-pointer text-sm text-gray-400 hover:text-gray-200">
			✕
		</div>
	</div>

		<!-- Divider -->
		<hr id="${this.props.id}-divider"
		 class="border-t border-white border-opacity-15" />

		<!-- Aquí puedes agregar el contenido del chat -->
		<div id="${this.props.id}-body" class=" flex-1 py-2 px-5 overflow-y-auto text-sm  space-y-2">
		</div>

<form id="${this.props.id}-form" class=" m-4 rounded-lg flex items-center bg-[#1D1F2B] bg-opacity-30">
  <input
	type="text"
	placeholder="Escribe algo..."
	class="flex-1 pl-4 py-2 text-sm text-white bg-transparent focus:outline-none"
  />
  <button
	type="submit"
	class="p-2 text-white hover:bg-white/10 rounded-lg transition"
  >
	  <svg 
	  xmlns="http://www.w3.org/2000/svg" 
	  fill="none"
	   viewBox="0 0 24 24"
		 stroke="currentColor" 
		 class="h-5 w-5">
  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
</svg>


  </button>
</form>

	</div>
	`;
  }

  protected initEvents(): void {
    // Aquí puedes inicializar eventos específicos del componente
    if (this.element) {
      const content = this.element.querySelector(
        `#${this.props.id}-body`
      ) as HTMLDivElement;

	  this.updateStatus();

      let count = 0;
      if (this.props.messages) {
        count = this.props.messages.length;
      }
      while (this.props.messages && count > 0) {
        const message = this.props.messages[count - 1];
        const messageComponent = new MessageComponent({
          text: message.content.text,
          currentUser: message.sender_id === this.props.currentUser, // Cambia esto según la lógica de tu aplicación
          avatar: message.avatarUrl || "https://via.placeholder.com/40",
        });
        content.appendChild(messageComponent.render());
        count--;
      }
      const form = this.element.querySelector("form") as HTMLFormElement;
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const input = form.querySelector("input") as HTMLInputElement;
        console.log(input.value);
        const messageComponent = new MessageComponent({
          text: input.value,
          currentUser: true, // Cambia esto según la lógica de tu aplicación
          avatar: this.props.currentUserAvatar || "https://via.placeholder.com/40",
        });
        this.element
          ?.querySelector(`#${this.props.id}-body`)
          ?.appendChild(messageComponent.render());

        this.props.onSendMessage?.(input.value);
        input.value = "";
      });
    }
    this.element
      ?.querySelector(`#${this.props.id}-close`)
      ?.addEventListener("click", () => {
        this.element?.remove();
        this.props.onExit();
      });

    const header = this.element?.querySelector(
      `#${this.props.id}-header`
    ) as HTMLElement;
    if (!header) return;

    header.addEventListener("click", () => {
      const chatItem = header.closest(`#${this.props.id}`) as HTMLElement;

      if (!chatItem) return;

      chatItem.classList.toggle("h-[22rem]");
      chatItem.classList.toggle("h-fit");
      chatItem
        .querySelector(`#${this.props.id}-body`)
        ?.classList.toggle("hidden");
      chatItem
        .querySelector(`#${this.props.id}-divider`)
        ?.classList.toggle("hidden");
      chatItem
        .querySelector(`#${this.props.id}-form`)
        ?.classList.toggle("hidden");
    });
  }
}
