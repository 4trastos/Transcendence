
// src/utils/component.ts

export interface ComponentProps {
	id?: string;
	className?: string;
	[key: string]: any;
  }
  
  export abstract class Component {
	protected element: HTMLElement | null = null;
	protected props: ComponentProps;
	protected template: string = '';
  
	constructor(props: ComponentProps = {}) {
	  this.props = props;
	}
  
	// Método para cargar plantilla HTML
	protected async loadTemplate(path: string): Promise<string> {
	  const response = await fetch(path);
	  return await response.text();
	}
  
	// Método para renderizar el componente
	public render(): HTMLElement {
	  if (!this.element) {
		// Crear elemento contenedor temporal
		const temp = document.createElement('div');
		temp.innerHTML = this.processTemplate();
		
		// Extraer el primer hijo como elemento principal
		this.element = temp.firstElementChild as HTMLElement;
		
		// Asignar ID si se proporcionó
		if (this.props.id) {
		  this.element.id = this.props.id;
		}
		
		// Añadir clases adicionales si se proporcionaron
		if (this.props.className) {
		  this.element.classList.add(...this.props.className.split(' '));
		}
  
		// Inicializar eventos después de renderizar
		this.initEvents();
	  }
  
	  return this.element;
	}
  
	// Método para procesar las variables en la plantilla
	protected processTemplate(): string {
	  let processedTemplate = this.template;
  
	  // Reemplazar variables en la plantilla con valores de props
	  for (const [key, value] of Object.entries(this.props)) {
		if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
		  const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
		  processedTemplate = processedTemplate.replace(regex, String(value));
		}
	  }
  
	  return processedTemplate;
	}
  
	// Método para inicializar eventos, a ser implementado por subclases
	protected initEvents(): void {
	  // Los componentes específicos implementarán esta funcionalidad
	}
  
	// Método para actualizar el componente con nuevas props
	public update(newProps: Partial<ComponentProps> = {}): void {
	  this.props = { ...this.props, ...newProps };
	  
	  if (this.element) {
		const parent = this.element.parentElement;
		if (parent) {
		  // Almacenar una referencia al elemento actual
		  const oldElement = this.element;
		  
		  // Resetear el elemento para forzar re-renderizado
		  this.element = null;
		  
		  // Renderizar el nuevo elemento
		  const newElement = this.render();
		  
		  // Reemplazar el antiguo elemento con el nuevo
		  parent.replaceChild(newElement, oldElement);
		}
	  }
	}
  }
  
  // Función helper para montar componentes en el DOM
  export function mount(component: Component, container: HTMLElement | string): void {
	const targetContainer = typeof container === 'string' 
	  ? document.querySelector(container) 
	  : container;
	
	if (targetContainer) {
		while (targetContainer.firstChild) {
		  targetContainer.removeChild(targetContainer.firstChild);
		}
	  targetContainer.appendChild(component.render());
	} else {
	  console.error('Container not found:', container);
	}
  }