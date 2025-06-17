import { DataProfileChange } from "../../pages/profile/ProfilePage";
import { Component, ComponentProps } from "../../utils/component";

interface ProfileItemProps extends ComponentProps {
	field: string;
	value: string;
	position: string;
	classItem:string;
	hasEdit: boolean;
	avatarType: "image" | "svg" | "card";
	avatar?: string;
	avatarColor?: string;
	onEdit: () => void;
	onSave: (profile: [DataProfileChange]) => void;
}


export class ProfileItemComponent extends Component {
	protected props: ProfileItemProps;
	private tmpImage: File | undefined;
	constructor(props: ProfileItemProps) {
		super(props);
		this.props = props;
		this.template = this.renderTemplate();
	}

  toggleHidden() {
	const profileItem = this.element?.querySelector(`#profile-item-${this.props.id}`);
	profileItem?.classList.toggle("hidden");
  }
	getAvatarHTML() {
		if (this.props.avatarType === 'image') {
			return `<img id="avatar-profile-${this.props.id}" src="${this.props.avatar}" alt="${this.props.title}" class="w-7 h-7 rounded-full object-cover">`;
		}

		if (this.props.avatarType === 'svg') {
			return `<div id="avatar-profile-${this.props.id}" class="w-7 h-7 rounded-full overflow-hidden">
				${this.props.avatar}
			</div>`;
		}

		if (this.props.avatarType === 'card') {
			return `<div id="avatar-profile-${this.props.id}" class="w-7 h-7 rounded-full flex items-center justify-center" style="background-color: ${this.props.avatarColor || '#ccc'};">
			</div>`;
		}

		return ''; // fallback
	}

	//TODO: Animar en caso de Ocultarse u Construirse
  renderTemplate() {
	let classItem = this.props.classItem;
	switch(this.props.position){
		case "first": classItem += " rounded-t-lg ";
			break;
		case "last": classItem += " rounded-b-lg "
			break;
		case "uniq": classItem += " rounded-lg "
			break;
	}

	return `
	<div class="animate-expand-horizontal flex justify-center z-50 bg-white/10 ${classItem}"> 
		<div id="profile-item-${this.props.id}" class=" z-0 flex h-full w-full max-w-md overflow-hidden min-w-0 items-center space-x-3 py-4 px-6 ">
			
			<form id="upload-form-${this.props.id}" class="flex-shrink-0 flex flex-col justify-center items-center">
				${this.getAvatarHTML()}
				
				${ (this.props.field !== `Country` && this.props.field !== `Email`) ? `
				<input type="file" id="imageInput-${this.props.id}" name="image" accept="image/*" style="display: none;"/> 
				<label  id="prfile-label-edit-avatar" class="hidden" for="imageInput-${this.props.id}" style="cursor:pointer;">
					<a id="btn-edit"
					class=" hover:font-bold text-white hover:text-blue-400">Seleccionar imagen</a>
				</label>` : ""}

			</form>

			<div id="profile-text-${this.props.id}" class="flex-1 min-w-0">
				<p id="p-title-${this.props.id}" class="text-white font-regular text-lg"></p>
				<p id="p-sub-${this.props.id}" class="text-gray-400 text-sm font-ligth truncate"></p>
			</div>

				<div id="profile-input-${this.props.id}" class="px-5 hidden">
				${(this.props.field !== "Color") ?
					`<div class="relative">
						<input id="profile-input-value-${this.props.id}" type="text" placeholder="${this.props.field}" class="w-full bg-white/15 bg-opacity-10 text-sm text-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-gray-500">
					</div>
					`: ''}
				</div>
			<div class="flex flex-row space-x-4">

				<div id="profile-btn-back-${this.props.id}" class="hidden bg-[#11162F] rounded-full">
					<button 
						class="ripple hover:bg-white/10 text-white text-sm py-2 px-6 rounded-full">Atras
					</button>
				</div>
				<div class="w-fit flex rounded-full bg-gradient-animate  p-[1px] items-center justify-end">
					<div class="bg-[#11162F] rounded-full">
						<button id="profile-edit-${this.props.id}" 
							class="ripple hover:bg-white/10 text-white text-sm py-2 px-6 rounded-full">
							${this.props.hasEdit? "Editar" : "Guardar"}
						</button>
					</div>
				</div>

			</div>
		</div>
	</div>
	`;
	}


	//TODO: Simplificar en una funcion llamada toggle
	protected initEvents(): void {
		if (!this.element) return;	

		
		if (this.props.avatarType === "image") {
			const avatar = this.element.querySelector(`#avatar-profile-${this.props.id}`) as HTMLImageElement;
			if (!avatar) return;
			const imageInput = this.element.querySelector(`#imageInput-${this.props.id}`);
			if (!imageInput) return;
			imageInput.addEventListener('change', async (e) =>{
				if (!e || !e.target) return;
				const input = e.target as HTMLInputElement;
				if (!input) return;
				const file = input.files?.[0]
				if (!file) return;
				avatar.src = URL.createObjectURL(file);
				this.tmpImage = file;
			});
		}
		const profileItem = this.element.querySelector(`#profile-item-${this.props.id}`);
		if (!profileItem)
			return;
		const profileText = this.element.querySelector(`#profile-text-${this.props.id}`);
		if (!profileText)
			return;
		const profileInput = this.element.querySelector(`#profile-input-${this.props.id}`);
		if (!profileInput)
			return;
		const pTitle = this.element.querySelector(`#p-title-${this.props.id}`);
		const pSub = this.element.querySelector(`#p-sub-${this.props.id}`);
		if (pTitle)
			pTitle.textContent = this.props.field;
		if (pSub)
			pSub.textContent = this.props.value;
		const btn = this.element.querySelector(`#profile-edit-${this.props.id}`);

		const btnBack = this.element.querySelector(`#profile-btn-back-${this.props.id}`);
		const avatar = this.element.querySelector(`#avatar-profile-${this.props.id}`);
		const editLink = this.element.querySelector(`#prfile-label-edit-avatar`);
		if (btn &&btnBack&& avatar) {
			btnBack.addEventListener('click', () => {
				profileText.classList.toggle("hidden");
				profileInput.classList.toggle("hidden");
				profileItem.classList.toggle("space-y-6");
				profileItem.classList.toggle("flex-col");
				avatar.classList.toggle("w-7");
				avatar.classList.toggle("h-7");
				avatar.classList.toggle("w-[4rem]");
				avatar.classList.toggle("h-[4rem]");
				btnBack.classList.toggle("hidden");
				btn.innerHTML = "Editar";
				this.props.hasEdit = true;
				editLink?.classList.toggle("hidden");
				this.props.onEdit();

			});
			btn.addEventListener("click", () => {
				//Expandir este item
				profileText.classList.toggle("hidden");
				profileInput.classList.toggle("hidden");
				profileItem.classList.toggle("space-y-6");
				profileItem.classList.toggle("flex-col");
				editLink?.classList.toggle("hidden");
				avatar.classList.toggle("w-7");
				avatar.classList.toggle("h-7");
				avatar.classList.toggle("w-[4rem]");
				avatar.classList.toggle("h-[4rem]");
				btnBack.classList.toggle("hidden");
				if (this.props.hasEdit) {
					this.props.hasEdit = false;
					btn.innerHTML = "Guardar";
					this.props.onEdit();
				} else if(!this.props.hasEdit) {
					this.props.hasEdit = true;
					btn.innerHTML = "Editar";
					const profileInputValue = this.element?.querySelector(`#profile-input-value-${this.props.id}`) as HTMLInputElement | null;
					// Guardo la imagen que se captura


					this.props.onSave([{
						field:this.props.field,
						value: profileInputValue?.value ?? this.props.value,
					}]);
				}
			});
		}
		//TODO: Agregar boton de Guardar y Comprimir item
	}


	//TODO: Funcion que cambie parametros

	//TODO: Funcion que reconozca segun el field si debe seleccionar otro Avatar

	//TODO: 

}