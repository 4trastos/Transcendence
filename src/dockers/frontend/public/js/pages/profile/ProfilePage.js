import { Component } from "../../utils/component.js";
import { ProfileImage } from "../../components/ProfileImage/ProfileImage.js";
import { Label } from "../../components/Label/Label.js";
export class ProfilePage extends Component {
    constructor() {
        super();
        this.template = `
        <div class="w-full h-full my-12 flex flex-col justify-center items-center">
			<div id="profile" class="flex flex-col w-full h-full space-y-6">
			    <!-- Carga los datos del profile: fdp, username, email... -->
                <div id="div-img" class="flex"></div>
                <div id="div-username" class="flex">
                </div>
                <hr class="border-white border-t-3 h-1 w-3/4 ml-0 sm:w-2/3 md:w-1/2 lg:w-1/3"/>
                <div id="div-detail"></div>
		    </div>		
		</div>
		`;
    }
    async initEvents() {
        if (!this.element) {
            return;
        }
        const profile = this.element.querySelector("#profile");
        //Los datos cargados seran los adqueridos de la base de datos, de momento somo Manolo
        if (profile) {
            const divImg = this.element.querySelector("#div-img");
            const divUsername = this.element.querySelector("#div-username");
            const divDetail = this.element.querySelector("#div-detail");
            const src = '/images/pfp.jpg';
            const img = new ProfileImage({ src });
            divImg.appendChild(img.render());
            const username = new Label({ id: 'username', content: 'Xxx_ManoloGamer69_xxX' });
            divUsername.appendChild(username.render());
            const firstName = new Label({ id: 'first-name', content: 'Name: Manolo', className: 'text-white p-2 block' });
            const lastName = new Label({ id: 'last-name', content: 'Lastname: Jimenez', className: 'text-white p-2 block' });
            const email = new Label({ id: 'email', content: 'Email: manolo.es.pro@progamer.com', className: 'text-white p-2 block' });
            divDetail.appendChild(firstName.render());
            divDetail.appendChild(document.createElement('br'));
            divDetail.appendChild(lastName.render());
            divDetail.appendChild(document.createElement('br'));
            divDetail.appendChild(email.render());
        }
    }
}
//# sourceMappingURL=ProfilePage.js.map