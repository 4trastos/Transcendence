import { Component } from "../../utils/component.js";
;
class MessageComponent extends Component {
    constructor(props) {
        super(props);
        this.props = props;
        this.template = this.renderTemplate();
    }
    renderTemplate() {
        this.props.avatar = this.props.avatar || 'https://via.placeholder.com/40';
        if (this.props.owner === true) {
            return `

	<div id="chat-message" class="flex flex-col gap-4">
		<div class="flex flex-col items-end gap-1" >
			<div class="flex items-end gap-2">
				<!-- Burbuja de mensaje -->
				<div class="bg-gray-600 text-white rounded-t-lg rounded-bl-lg px-4 py-2 max-w-xs">
				${this.props.text}
				</div>
				<!-- Avatar -->
				<img src="${this.props.avatar}" class="w-8 h-8 rounded-full" />
			</div>
			<!-- Hora debajo de la burbuja -->
			<span class="text-xs text-gray-400 mr-12">16:45</span>
		</div>
	</div>

`;
        }
        else {
            return `
	<div id="chat-message" class="flex flex-col gap-4">
		<div class="flex flex-col items-start gap-1" >
			<div class="flex items-end gap-2">
				<!-- Avatar -->
				<img src="${this.props.avatar}" class="w-8 h-8 rounded-full" />
				<!-- Burbuja de mensaje -->
				<div class="bg-gray-700 text-white rounded-t-lg rounded-br-lg px-4 py-2 max-w-xs">
				${this.props.text}
				</div>
			</div>
			<span class="text-xs text-gray-400 ml-12">16:45</span>
		</div>
	</div>
  `;
        }
        ;
    }
}
export class FloatingChatComponent extends Component {
    constructor(props) {
        super(props);
        this.props = props;
        this.template = this.renderTemplate();
    }
    renderTemplate() {
        return `
	<div class="fixed backdrop-blur-2xl bg-opacity-15 bg-[#1D1F2B] bottom-4 right-4 w-80 h-96  border border-white border-opacity-30 rounded-lg shadow-lg flex flex-col overflow-hidden z-50">
	<!-- Header del chat -->	
	<div class="relative flex items-center space-x-2 px-4 py-2  text-white">
		<div id="chat-avatar">
			<!-- Aquí puedes poner una imagen o ícono -->
			<img src="avatar.png" alt="Avatar" class="w-8 h-8 rounded-full" />
		</div>
		
		<div>
			<div id="chat-name" class="font-semibold">Chat Soporte</div>
			<div id="chat-status" class="text-gray-400 text-sm">En línea</div>
		</div>

		<div id="chat-close" class="absolute top-2 right-2 cursor-pointer text-gray-400 hover:text-gray-200">
			✕
		</div>
	</div>

		<!-- Divider -->
		<hr class="border-t border-white border-opacity-15" />

		<!-- Aquí puedes agregar el contenido del chat -->
		<div id="chat-body" class="flex-1 p-2 overflow-y-auto text-sm scrollbar-thin-dark" style="
		@layer utilities {
  .scrollbar-thin-dark::-webkit-scrollbar {
    width: 8px;
  }
  .scrollbar-thin-dark::-webkit-scrollbar-track {
    background: transparent;
  }
  .scrollbar-thin-dark::-webkit-scrollbar-thumb {
    background-color: #4B5563; /* gray-600 */
    border-radius: 9999px;
  }
}
  ">
		</div>

<form class="m-4 rounded-lg flex items-center bg-[#1D1F2B] bg-opacity-30">
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
      class="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  </button>
</form>

	</div>
	`;
    }
    initEvents() {
        // Aquí puedes inicializar eventos específicos del componente
        if (this.element) {
            const content = this.element.querySelector('#chat-body');
            const message = new MessageComponent({ text: 'Hola, Miguel', owner: true });
            content.appendChild(message.render());
            const message2 = new MessageComponent({ text: 'Hola, Herrera', owner: false });
            content.appendChild(message2.render());
            const message3 = new MessageComponent({ text: 'He estado muy ocupado ultimamente, pero me preguntaba que sobre marta, la viste?', owner: true });
            content.appendChild(message3.render());
            const message4 = new MessageComponent({ text: 'Yo realice un trabajo de investigacion esta semana consegui el primer puesto!', owner: false });
            content.appendChild(message4.render());
            const message5 = new MessageComponent({ text: 'A marta la vi en la celebracion, me pregunto por ti, todo bien?', owner: false });
            content.appendChild(message5.render());
            const form = this.element.querySelector('form');
            form.addEventListener('submit', (event) => {
                event.preventDefault();
                const input = form.querySelector('input');
                console.log(input.value); // Aquí puedes manejar el envío del mensaje
                input.value = ''; // Limpiar el campo de entrada
            });
        }
    }
}
//# sourceMappingURL=FloatingChat.js.map