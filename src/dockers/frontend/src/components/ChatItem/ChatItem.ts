import { Component, ComponentProps } from '../../utils/component';

export interface ChatItemProps extends ComponentProps {
  id: string;
  title: string;
  isActive: boolean;
  isGroupChat: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  avatarUrl?: string;
  onClick: (id: string) => void;
}

export class ChatItem extends Component {
  protected props: ChatItemProps;

  constructor(props: ChatItemProps) {
    super(props);
    this.props = props;
    
    // Definimos la plantilla HTML con clases de Tailwind
    this.template = `<div class="cursor-pointer p-3 rounded-lg mb-2 transition-colors hover:bg-gray-100 ${this.props.isActive ? 'bg-blue-50 border-l-4 border-blue-500' : ''}">
      <div class="flex items-center">
        <!-- Avatar -->
        <div class="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center mr-3 text-gray-600 overflow-hidden">
          ${this.props.avatarUrl 
            ? `<img src="${this.props.avatarUrl}" alt="${this.props.title}" class="w-full h-full object-cover">` 
            : `<span class="text-xl font-semibold">${this.getInitials(this.props.title)}</span>`}
        </div>
        
        <!-- Contenido -->
        <div class="flex-grow">
          <div class="flex justify-between items-center">
            <h3 class="font-medium ${this.props.isActive ? 'text-blue-600' : ''}">${this.props.title}</h3>
            ${this.props.lastMessageTime 
              ? `<span class="text-xs text-gray-500">${this.props.lastMessageTime}</span>` 
              : ''}
          </div>
          
          <div class="flex justify-between items-center mt-1">
            ${this.props.lastMessage 
              ? `<p class="text-sm text-gray-600 truncate">${this.props.lastMessage}</p>` 
              : `<p class="text-sm text-gray-400 italic">Sin mensajes</p>`}
            
            ${this.props.unreadCount && this.props.unreadCount > 0 
              ? `<span class="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">${this.props.unreadCount}</span>` 
              : ''}
          </div>
        </div>
        
        <!-- Icono de grupo si es chat grupal -->
        ${this.props.isGroupChat 
          ? `<div class="ml-2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>` 
          : ''}
      </div>
    </div>`;
  }

  // Obtener las iniciales para el avatar
  private getInitials(name: string): string {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }

  protected initEvents(): void {
    if (this.element && this.props.onClick) {
      this.element.addEventListener('click', () => {
        this.props.onClick(this.props.id);
      });
    }
  }
}

