import { Component } from "../../utils/component.js";
class FloatingContactsComponent extends Component {
    constructor(props) {
        super(props);
        this.props = props;
        this.template = this.renderTemplate();
    }
    renderTemplate() {
        return `
	  <div class="flex flex-col gap-4">
		<div class="flex flex-col gap-2">
		  <h1 class="text-2xl font-bold">Contactos</h1>
		  <div class="flex flex-col gap-2" id="contacts-list"></div>
		</div>
	  </div>
	`;
    }
}
//# sourceMappingURL=FloatingContatcsComponent.js.map