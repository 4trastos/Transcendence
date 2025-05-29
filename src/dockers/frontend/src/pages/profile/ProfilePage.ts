import { Component, ComponentProps } from "../../utils/component";
import { ProfileImage } from "../../components/ProfileImage/ProfileImage";
import { Label } from "../../components/Label/Label"

export class ProfilePage extends Component {
    constructor() {
    super();
    this.template = `
    <div class="w-screen h-screen my-12 flex flex-col justify-center items-center">
        <div class=" w-fit h-fit  flex flex-col overflow-hidden px-[5px] rounded bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)] shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <div id="profile" class=" bg-[#11162F] flex flex-col w-fit h-fit space-y-4">
                <!-- Carga los datos del profile: fdp, username, email... -->
                <div class="relative flex flex-row justify-center items-center"> 
                    <div id="div-img" class="flex"></div>
                    <div id="div-username" class="flex">
                </div>
                </div>
                <hr class="border-white border-t-3 h-1 w-3/4 ml-0 sm:w-2/3 md:w-1/2 lg:w-1/3"/>
                <div id="div-detail"></div>
            </div>		
        </div>
    </div>
        `;
    }

    protected async initEvents(): Promise<void> {
        if (!this.element){
            return;
        }
        const profile = this.element.querySelector("#profile") as HTMLElement
        //Los datos cargados seran los adqueridos de la base de datos, de momento somo Manolo
        if (profile){
            const divImg = this.element.querySelector("#div-img") as HTMLElement
            const divUsername = this.element.querySelector("#div-username") as HTMLElement
            const divDetail = this.element.querySelector("#div-detail") as HTMLElement

            const src = '/images/pfp.jpg'
            const img = new ProfileImage({src, size:4});
            divImg.appendChild(img.render());

            const username = new Label({id: 'username', content: 'Xxx_ManoloGamer69_xxX'})
            divUsername.appendChild(username.render());

            const firstName = new Label({id: 'first-name', content: 'Name: Manolo', className: 'text-white p-2 block'})
            const lastName = new Label({id: 'last-name', content: 'Lastname: Jimenez', className: 'text-white p-2 block'})
            const email = new Label({id: 'email', content: 'Email: manolo.es.pro@progamer.com', className: 'text-white p-2 block'})
            divDetail.appendChild(firstName.render())
            divDetail.appendChild(document.createElement('br'))
            divDetail.appendChild(lastName.render())
            divDetail.appendChild(document.createElement('br'))
            divDetail.appendChild(email.render())
        }
    }
}