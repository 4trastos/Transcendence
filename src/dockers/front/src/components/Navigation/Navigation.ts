import { Component, ComponentProps } from '../../utils/component';

interface NavigationProps extends ComponentProps {
  items: Array<{
    text: string;
    url: string;
    active?: boolean;
  }>;
}

export class Navigation extends Component {
  protected props: NavigationProps;

  constructor(props: NavigationProps) {
    super(props);
    this.props = props;
    this.template = this.renderTemplate();
  }
  changeActiveItem(newActiveItem: string) {
    const underline = this.element?.querySelector('#active-underline') as HTMLElement;
    const navContainer = this.element?.querySelector('#ul-items') as HTMLElement;
  
    this.props.items.forEach((item) => {
      const itemId = `#item-${item.text.toLowerCase()}`;
      const itemElement = this.element?.querySelector(itemId) as HTMLElement;
  
      if (item.url === newActiveItem) {
        item.active = true;
        itemElement?.classList.remove('text-gray-300', 'font-light', 'hover:text-white', 'transition-colors');
        itemElement?.classList.add('text-white', 'font-medium');
  
        // Mover subrayado
        if (itemElement && underline && navContainer) {
          const itemRect = itemElement.getBoundingClientRect();
          const navRect = navContainer.getBoundingClientRect();
          const leftOffset = itemRect.left - navRect.left;
          const width = itemRect.width + 32; // 2rem extra como antes
          underline.style.width = `${width}px`;
          underline.style.transform = `translateX(${leftOffset - 16}px)`;
        }
  
      } else {
        item.active = false;
        itemElement?.classList.remove('text-white', 'font-medium');
        itemElement?.classList.add('text-gray-300', 'font-light', 'hover:text-white', 'transition-colors');
      }
    });
  }
  
  private renderNavItems(): string {
    return this.props.items.map((item) => {
      const activeClass = item.active
        ? 'text-white text-sm font-medium'
        : 'text-gray-300 text-sm font-light hover:text-white transition-colors';
  
      return `
        <li class="relative inline-block">
          <a id="item-${item.text.toLowerCase()}" href="${item.url}" class="relative pb-1 ${activeClass}">
            ${item.text}
          </a>
        </li>
      `;
    }).join('');
  }

renderTemplate(): string {
  return `
<nav class="w-full text-white flex justify-center">
  <div class="relative inline-flex">
    <ul id="ul-items" class="flex justify-center space-x-16 pt-4 mb-3">
      ${this.renderNavItems()}
    </ul>
    <!-- Subrayado dinámico -->
    <span id="active-underline"
          class="absolute bottom-0 h-0.5 bg-white transition-all duration-300 ease-in-out"
          style="width: 0; transform: translateX(0);">
    </span>
  </div>
</nav>
  `;
}

  public update(newProps: Partial<NavigationProps> = {}): void {
    super.update(newProps);
    if (newProps.items) {
      this.props = { ...this.props, ...newProps };
      this.template = this.renderTemplate();
    }
  }
}