import { DataPasswordChange, DataProfileChange } from "../../pages/profile/ProfilePage";
import { Component, ComponentProps } from "../../utils/component";

interface ProfileAuthItemProps extends ComponentProps {
	field: string;
	value: string;
	position: string;
	classItem:string;
	hasEdit: boolean;
	avatarType: "image" | "svg" | "card";
	avatar?: string;
	avatarColor?: string;
	onEdit: () => void;
	onSave: (profile: [DataPasswordChange]) => void;
}


export class ProfileAuthItemComponent extends Component {
	protected props: ProfileAuthItemProps;
	constructor(props: ProfileAuthItemProps) {
	super(props);
	this.props = props;
	this.template = this.renderTemplate();
  }

	toggleHidden() {
		const profileItem = this.element?.querySelector(`#profile-item-${this.props.id}`);
		profileItem?.classList.toggle("hidden");
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
	<div class="flex justify-center z-50 bg-white/10 ${classItem}"> 
		<div id="profile-item-${this.props.id}" class=" z-0 flex h-full w-full max-w-md overflow-hidden min-w-0 items-center space-x-3 py-4 px-6 ">
			
			<div class="flex-shrink-0 flex flex-col justify-center items-center">
				<div id="avatar-profile-${this.props.id}" class="w-7 h-7 rounded-full overflow-hidden">
					${this.props.avatar}
				</div>
			</div>

			<div id="profile-text-${this.props.id}" class="flex-1 min-w-0">
				<p id="p-title-${this.props.id}" class="text-white font-regular text-lg"></p>
				<p id="p-sub-${this.props.id}" class="text-gray-400 text-sm font-ligth truncate"></p>
			</div>

				<div id="profile-input-${this.props.id}" class="px-5 hidden">
				${(this.props.field !== "Color") ?
					`<div class="relative flex flex-col space-y-2">
						<input id="profile-current-pass-${this.props.id}" type="password" placeholder="Actual contraseña" class="w-full bg-white/10 bg-opacity-10 text-sm text-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-gray-500">
						<input id="profile-new-pass-${this.props.id}" type="password" placeholder="Nueva contraseña" class="w-full bg-white/10 bg-opacity-10 text-sm text-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-gray-500">
						<input id="profile-rep-pass-${this.props.id}" type="password" placeholder="Repite la contraseña" class="w-full bg-white/10 bg-opacity-10 text-sm text-gray-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-gray-500">
					</div>
					`: ''}
				</div>
			<div class="flex flex-row space-x-4">

				<div id="profile-btn-back-${this.props.id}" class="hidden bg-[#11162F] rounded-full">
					<button 
						class=" hover:bg-white/10 text-white text-sm py-2 px-6 rounded-full">Atras
					</button>
				</div>
				<div class="w-fit flex rounded-full bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)]  p-[1px] items-center justify-end">
					<div class="bg-[#11162F] rounded-full">
						<button id="profile-edit-${this.props.id}" 
							class=" hover:bg-white/10 text-white text-sm py-2 px-6 rounded-full">
							${this.props.hasEdit? "Editar" : "Guardar"}
						</button>
					</div>
				</div>

			</div>
		</div>
	</div>
	`;
	}

	protected initEvents(): void {
		if (!this.element) return;	
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
				if (this.props.hasEdit) {
					this.props.hasEdit = false;
					btn.innerHTML = "Guardar";
					console.log("ProfileAuth onEdit")
					this.props.onEdit();
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

				} else if(!this.props.hasEdit) {
					console.log("ProfileAuth onSave")
					const currentPassword = this.element?.querySelector(`#profile-current-pass-${this.props.id}`) as HTMLInputElement | null;
					const newPassword = this.element?.querySelector(`#profile-new-pass-${this.props.id}`) as HTMLInputElement | null;
					const repitePassword = this.element?.querySelector(`#profile-rep-pass-${this.props.id}`) as HTMLInputElement | null;
					if (!newPassword || !repitePassword || (newPassword.value !== repitePassword.value)){
						this.showTemporaryPasswordError("new");
						return ;
					}
					else if (!currentPassword){
						this.showTemporaryPasswordError("current");
						return ;
					}
					this.props.onSave([{
						password: currentPassword.value ?? "",
						newPassword: newPassword.value ?? ""
					}]);
				}
			});
		}
		//TODO: Agregar boton de Guardar y Comprimir item
	}

	toggleView(txtBtn: string, hasEdit: boolean) {
			if (!this.element) return;	
		const profileItem = this.element.querySelector(`#profile-item-${this.props.id}`);
		if (!profileItem)
			return;
		const profileText = this.element.querySelector(`#profile-text-${this.props.id}`);
		if (!profileText)
			return;
		const profileInput = this.element.querySelector(`#profile-input-${this.props.id}`);
		if (!profileInput)
			return;
		const btn = this.element.querySelector(`#profile-edit-${this.props.id}`);

		const btnBack = this.element.querySelector(`#profile-btn-back-${this.props.id}`);
		const avatar = this.element.querySelector(`#avatar-profile-${this.props.id}`);
		const editLink = this.element.querySelector(`#prfile-label-edit-avatar`);
		if (!(btn &&btnBack&& avatar)) return ;
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
		this.props.hasEdit = hasEdit;
		btn.innerHTML = txtBtn;

	}
	/**
	 * 
	 * @param type Si el error se mostrara sobre current o new password
	 * @returns 
	 */
	showTemporaryPasswordError(type: string) {
		if (!this.element) return;
		const input = this.element.querySelector(`#profile-${type}-pass-${this.props.id}`) as HTMLInputElement | null;
		if (!input) return;
		input.setCustomValidity("Input inválido");
		input.reportValidity(); // Muestra el mensaje de error
		setTimeout(() => {
			input.setCustomValidity("");
			input.reportValidity(); // Vuelve a evaluar, útil si el usuario no ha tocado el campo
		}, 3000);
	}


}