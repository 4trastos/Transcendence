// src/utils/component.ts
export class Component {
    constructor(props = {}) {
        this.element = null;
        this.template = '';
        this.props = props;
    }
    // Método para cargar plantilla HTML
    async loadTemplate(path) {
        const response = await fetch(path);
        return await response.text();
    }
    // Método para renderizar el componente
    render() {
        if (!this.element) {
            // Crear elemento contenedor temporal
            const temp = document.createElement('div');
            temp.innerHTML = this.processTemplate();
            // Extraer el primer hijo como elemento principal
            this.element = temp.firstElementChild;
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
    processTemplate() {
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
    initEvents() {
        // Los componentes específicos implementarán esta funcionalidad
    }
    // Método para actualizar el componente con nuevas props
    update(newProps = {}) {
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
export function mount(component, container) {
    const targetContainer = typeof container === 'string'
        ? document.querySelector(container)
        : container;
    if (targetContainer) {
        while (targetContainer.firstChild) {
            targetContainer.removeChild(targetContainer.firstChild);
        }
        targetContainer.appendChild(component.render());
    }
    else {
        console.error('Container not found:', container);
    }
}
//# sourceMappingURL=component.js.map