import { ChatItem } from "../../components/ChatItem/ChatItem";
import { Chat } from "../../data/Chat";
import { Component } from "../../utils/component";

export class ChatPage extends Component {
  private socket: WebSocket | undefined;
  private activeChat: string | null = null;
  private userId: number = 3;

  constructor() {
    super();
    this.template = `
		<div class="container mx-auto">
  <div id="navigation-container"></div>
  <main class="flex-1 flex flex-col p-4">
    <div id="chat-box" class="flex flex-col gap-2 overflow-y-auto h-full px-4 py-2 space-y-2 p-4 bg-white shadow-md rounded-md"></div>
    <div class="mt-4 flex">
      <input id="message-input" type="text" class="flex-1 p-2 border rounded-md" placeholder="Escribe un mensaje...">
      <button id="send-button" class="ml-2 bg-blue-500 text-white px-4 py-2 rounded-md">Enviar</button>
    </div>
  </main>
  <aside class="w-1/4 bg-white p-4 border-l shadow-md">
    <h2 class="text-xl font-semibold mb-4">Chats Activos</h2>
    <ul id="chat-list" class="space-y-2"></ul>
  </aside>
</div>
`;
  }

  protected initEvents(): void {
    if (!this.element) return;

    //Inicializar WebSocket
    this.socket = new WebSocket(
      "wss://transcendence.42.fr/api/v1/chats/connect-ws?userId=3"
    );
    this.socket.addEventListener("open", () => {
      console.log("Conexión WebSocket abierta");
    });

    this.socket.addEventListener("message", this.handleMessage.bind(this));

    // Simulación del chat
    const sendButton = this.element.querySelector("#send-button");
    if (sendButton) {
      sendButton.addEventListener("click", this.sendMessage.bind(this));
    }

    this.loadChats();
  }

  private async loadChats() {
    if (this.element === null) return;

    try {
      const res = await fetch(
        "https://transcendence.42.fr/api/v1/chats/user/3",
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data: Chat[] = await res.json();
      this.renderChatList(data);
    } catch (err) {
      console.error("Error al cargar chats:", err);
    }
  }

  renderChatList(chats: Chat[]) {
    if (this.element === null) return;
    if (!this.element) return;

    const chatList = this.element.querySelector("#chat-list");
    if (!chatList) return;

    // Limpiar la lista primero
    chatList.innerHTML = "";

    // Para cada chat, crear un componente ChatItem
    chats.forEach((chat: Chat) => {
      // Determinar el título para mostrar
      const chatTitle = chat.isGroupChat
        ? chat.title
        : chat.users.filter((str: string) => str !== "3").join(", ");

      // Crear el componente ChatItem
      const chatItemComponent = new ChatItem({
        id: chat.id,
        title: chatTitle,
        isActive: this.activeChat === chat.id,
        isGroupChat: chat.isGroupChat,
        // Puedes agregar estas propiedades si están disponibles en tu objeto chat
        lastMessage:
          chat.messages[chat.messages.length - 1]?.content.text || "", // Último mensaje
        lastMessageTime: "", // Hora del último mensaje
        unreadCount: 0,
        avatarUrl: "",
        onClick: (id) => {
          this.activeChat = id;
          this.openChat(id);
        },
      });

      // Crear un elemento de lista y agregar el componente renderizado
      const listItem = document.createElement("li");
      listItem.appendChild(chatItemComponent.render());
      chatList.appendChild(listItem);
    });
  }
  private async openChat(chatId: string) {
    if (this.element === null) return;
    try {
      const res = await fetch(
        `https://transcendence.42.fr/api/v1/chats/${chatId}/messages`,
        {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );
      const messages = await res.json();
      const chatBox = this.element.querySelector("#chat-box");
      if (chatBox) {
        chatBox.innerHTML = ""; // Limpiar el chat antes de cargar nuevos mensajes
        messages.forEach((message: any) => {
          const messageDiv = document.createElement("div");
          messageDiv.textContent = message.content.text;
          chatBox.appendChild(messageDiv);
        });
      }
    } catch (err) {
      console.error("Error al abrir chat:", err);
    }
  }

  private handleMessage(event: MessageEvent) {
    const data = JSON.parse(event.data);
    if (this.element === null) return;

    // Verificar si el mensaje pertenece al chat activo
    if (this.activeChat === data.chatId) {
      const chatBox = this.element.querySelector("#chat-box");
      if (chatBox) {
        const messageDiv = document.createElement("div");
        messageDiv.textContent = data.message;
        chatBox.appendChild(messageDiv);

        chatBox.scrollTop = chatBox.scrollHeight; // Desplazar el chat hacia abajo
      }
    }
  }

  private sendMessage() {
    if (this.element === null) return;
    const messageInput = this.element.querySelector(
      "#message-input"
    ) as HTMLInputElement;
    const messageText = messageInput.value.trim();

    if (messageText && this.activeChat) {
      const userMessage = document.createElement("div");
      userMessage.textContent = messageText;
      const chatBox = this.element.querySelector("#chat-box");
      if (chatBox) {
        chatBox.appendChild(userMessage);
        chatBox.scrollTop = chatBox.scrollHeight;
      }
      if (!this.socket) return;
      this.socket.send(
        JSON.stringify({
          sender_id: this.userId,
          chatId: this.activeChat,
          content: { text: messageText },
        })
      );

      messageInput.value = ""; // Limpiar el input
    }
  }
}
