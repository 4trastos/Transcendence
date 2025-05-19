import { FloatingChatComponent } from "../../components/Floating/FloatingChatComponent";
import FloatingChatListComponent from "../../components/Floating/FloatingContactsComponent";
import { Chat } from "../../data/Chat";
import { Component } from "../../utils/component";

export default class ChatView extends Component {
  private socket: WebSocket | undefined;
  private userId: string | undefined;
  private currentAvatarUrl: string | undefined;
  private floatingChats: Map<string, FloatingChatComponent> = new Map();
  private chatMembers: Map<string, string[]> = new Map();
  private chats: Map<string, Chat> = new Map();

  constructor(userId: string, currentAvatarUrl: string) {
    super();
    this.userId = userId;
    this.currentAvatarUrl = currentAvatarUrl;
    this.template = this.renderTemplate();
  }

  renderTemplate() {
    return `
	<div class="fixed bottom-4 right-4 flex flex-row items-end gap-2 z-50">
	<!-- Cards de chat (máximo 3, horizontal) -->
		<div id="chats-floating" class="flex gap-2 items-end bottom-4 max-w-[calc(100vw-2rem)]  overflow-x-auto"></div>
		<div id="contacts-floating" >
		</div>
	</div>
		`;
  }
  protected async initEvents(): Promise<void> {
    if (!this.element) return;

    this.socket = new WebSocket(
      `wss://transcendence.42.fr/api/v1/chats/connect-ws?userId=${this.userId}`
    );
    this.socket.addEventListener("open", () => {
      console.log("Conexión WebSocket abierta");
    });
    this.socket.addEventListener("close", () => {
      console.log("Conexión WebSocket cerrada");
    });

    this.socket.addEventListener("message", this.handleMessage.bind(this));

    await this.loadChats();
  }

  private handleMessage(event: MessageEvent) {
    const data = JSON.parse(event.data);
    if (this.element === null) return;
    console.log("Mensaje recibido:", data);
    // Verificar si el mensaje pertenece al chat activo
    if (this.chats.get(data.chatId)) {
      const chatBox = this.element.querySelector(
        "#chat-" + data.chatId
      ) as HTMLElement;
      
      if (data.message) {
        if (chatBox) {
          const messageDiv = document.createElement("div");
          messageDiv.textContent = data.message;
          chatBox.appendChild(messageDiv);
          chatBox.scrollTop = chatBox.scrollHeight; // Desplazar el chat hacia abajo
        }
      }
    } else if (data.status) { // data.chatId siempre es null
      this.chats.forEach((chat) => {
        if (chat.users.includes(data.userId)) {
          console.log("Cambiando estado del chat", chat.id, data.userId, data.status);
          this.floatingChats.get(chat.id)?.changeStatus(data.userId, data.status==="open");
        }
      });
    }
  }

  private async loadChats() {
    try {
      let chats: Chat[] = [
        {
          id: "1",
          active: true,
          title: "Gym Bros",
          avatarUrl: "",
          isGroupChat: true,
          users: ["1", "3", "2"],
          messages: [
            {
              chatId: "3",
              content: { text: "Hola" },
              sender_id: "2",
              avatarUrl: "/images/jubin_jack.svg",
            },
            {
              chatId: "3",
              content: { text: "Adrian! ¿Todavia estas en casa?" },
              sender_id: "3",
              avatarUrl: "/images/henry_deco.svg",
            },
          ],
        },
        {
          id: "2",
          active: false,
          title: "Devid Heilo",
          avatarUrl: '/images/devid_heilo.svg',
          isGroupChat: false,
          users: ["1", "3"],
          messages: [
            {
              chatId: "2",
              content: { text: "Hola, ¿cómo estás?" },
              sender_id: "1",
              avatarUrl: "/images/devid_heilo.svg",
            },
            {
              chatId: "2",
              content: { text: "Bien, desarrollando un proyecto, tu?" },
              sender_id: "3",
              avatarUrl: "/images/henry_deco.svg",

            },
          ],
        },
      ];
      let res: any;
      const env = await fetch("/env").then((res) => res.json());
      if (env.env === "production") {
        res = (await fetch(
          `https://transcendence.42.fr/api/v1/chats/user/${this.userId}`,
          {
            method: "GET",
            credentials: "include",
          }
        )) as Response;
        chats = await res.json();
      }
      if (env.env === "development" || res.status === 200) {
        if (chats.length > 0) {
          const chatContainer = this.element?.querySelector(
            "#chats-floating"
          ) as HTMLElement;
          for (let i = 0; i < chats.length; i++) {
            if (chats[i].active) {
              const onlineUsers = new Map<string, boolean>( );
              chats[i].users.forEach((userId) => {
                onlineUsers.set(userId, userId === this.userId);
              });

              const chatItemComponent = this.buildChat(onlineUsers, chats[i]);

              chatContainer.appendChild(chatItemComponent.render());
              this.floatingChats.set(chats[i].id, chatItemComponent);
              this.chatMembers.set(chats[i].id, chats[i].users);
              this.chats.set(chats[i].id, chats[i]);

            }
          }
        }
        const listContainer = this.element?.querySelector(
          "#contacts-floating"
        ) as HTMLElement;
        const listItemComponent = new FloatingChatListComponent({
          chats: chats,
          owner: "3",
          onClick: (id: string) => {
            const chatItem = chats.find((chat) => chat.id === id);
            if (!chatItem) return;

            if (this.element?.querySelector(`#chat-${id}`)) return;
            
            const onlineUsers = new Map<string, boolean>( );
            chatItem.users.forEach((userId) => {
              onlineUsers.set(userId, userId=== this.userId);
            });
            const chatItemComponent = this.buildChat(onlineUsers, chatItem);

            const chatContainer = this.element?.querySelector("#chats-floating") as HTMLElement;
            chatContainer.appendChild(chatItemComponent.render());
            this.floatingChats.set(chatItem.id, chatItemComponent);
            this.chatMembers.set(chatItem.id, chatItem.users);
            this.chats.set(chatItem.id, chatItem);
          },
        });
        listContainer.appendChild(listItemComponent.render());
      }
    } catch (error) {
      console.error("Error loading chats:", error);
    }
  }

  private buildChat(onlineUsers:any, chatItem: Chat): FloatingChatComponent {
    return  new FloatingChatComponent({
      id: "chat-" + chatItem.id,
      onLine: false,
      title: chatItem?.title,
      messages: chatItem?.messages,
      avatarUrl: chatItem?.avatarUrl,
      currentUserAvatar: this.currentAvatarUrl,
      currentUser: this.userId,
      onlineUser: onlineUsers,
      onExit: () => {
        this.socket?.send(
          JSON.stringify({
            sender_id: this.userId,
            chatId: chatItem.id,
            status: "close",
          })
        );
        this.floatingChats.delete(chatItem.id);
        this.chatMembers.delete(chatItem.id);
        this.chats.delete(chatItem.id);
      },
      onSendMessage: (message: string) => {
        this.sendMessage(chatItem.id, message);
      },
    });
  }
  private sendMessage(chatId: string, message: string) {
    if (this.element === null) return;
    if (!this.socket) return;
    this.socket.send(
      JSON.stringify({
        sender_id: this.userId,
        chatId: chatId,
        content: { text: message },
      })
    );
  }
}
