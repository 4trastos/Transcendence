import { DataProfileChange } from "../../pages/profile/ProfilePage";
import { Component, ComponentProps } from "../../utils/component";

interface ProfileAvatarItemProps extends ComponentProps {
	field: string;
	value: string;
	position: string;
	classItem:string;
	hasEdit: boolean;
	avatar?: string;
	avatarColor?: string;
	onEdit: (id:string) => void;
	onSave: (profile: DataProfileChange[], id:string) => void;
}


export class ProfileAvatarItemComponent extends Component {
	protected props: ProfileAvatarItemProps;
	private tmpImage: File | undefined;
	constructor(props: ProfileAvatarItemProps) {
		super(props);
		this.props = props;
		this.template = this.renderTemplate();
	}

  toggleHidden() {
	if (!this.element) return;
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
	<div class="animate-expand-horizontal  flex justify-center z-50 bg-white/10 ${classItem}"> 
		<div id="profile-item-${this.props.id}" class=" z-0 flex justify-center h-full w-full max-w-md overflow-hidden min-w-0  items-center space-x-3 py-4 px-6 ">
				<form id="upload-form-${this.props.id}" class="flex-shrink-0 flex flex-col space-y-2 justify-center  items-center">
					<input 
						type="file" 
						id="imageInput-${this.props.id}" 
						name="image" 
						accept="image/*" 
						style="display: none;"
					/>
					<img 
						id="avatar-profile-${this.props.id}" 
						src="${this.props.avatar}" 
						alt="${this.props.title}" 
						class="w-[6rem] h-[6rem] rounded-full object-cover cursor-pointer transition-transform duration-200 hover:scale-105"
					>
					<div class="flex flex-row">
						<div id="avatar-btn-cancel-${this.props.id}" class="hidden bg-[#11162F] mx-4 rounded-full">
							<button class="ripple hover:bg-white/10 text-white text-sm py-2 px-6  rounded-full">Atras</button>
						</div>
						<div class="w-fit flex rounded-full bg-gradient-animate  p-[1px] items-center justify-end">
							<div class="bg-[#11162F] rounded-full">
								<button id="avatar-btn-${this.props.id}" 
									class="ripple hover:bg-white/10 text-white text-sm py-2 px-6 rounded-full">
									${this.props.hasEdit? "Editar" : "Guardar"}
								</button>
							</div>
						</div>
					</div>
				</form>
		</div>
	</div>
	`;
	}


	//TODO: Simplificar en una funcion llamada toggle
	protected initEvents(): void {
		if (!this.element) return;

		const avatar = this.element.querySelector(`#avatar-profile-${this.props.id}`) as HTMLImageElement;
		if (!avatar) return;
		const btn = this.element.querySelector(`#avatar-btn-${this.props.id}`);
		if (!btn) return;
		const btnCancel = this.element.querySelector(`#avatar-btn-cancel-${this.props.id}`);
		if (!btnCancel) return;

		const imageInput = this.element.querySelector(`#imageInput-${this.props.id}`) as HTMLElement;
		avatar.addEventListener("click", (e) => {
			e.preventDefault(); // evitar que el form se envíe si es necesario
			imageInput.click();  // abre el selector de archivo
			
		});
		btn.addEventListener("click", (e) => {
			if (btn.textContent?.includes("Editar")){
				e.preventDefault(); // evitar que el form se envíe si es necesario
				imageInput.click();  // abre el selector de archivo
			} else if (btn.textContent?.includes("Guardar") && this.tmpImage){
				const dataUpload: DataProfileChange[] = [{
					field: this.props.field,
					value: this.tmpImage
				}];
				this.props.onSave(dataUpload, this.props.id || "");
			}
		});
		if (!imageInput) return;
		imageInput.addEventListener('change', async (e) =>{
			
			if (!e || !e.target) return;
			const input = e.target as HTMLInputElement;
			if (!input) return;
			const file = input.files?.[0]
			if (!file) return;
			avatar.src = URL.createObjectURL(file);
			this.tmpImage = file;
			btn.textContent = "Guardar"
			btnCancel.classList.toggle("hidden");
		});

		btnCancel.addEventListener('click', () => {
			this.tmpImage = undefined;
			btn.textContent = "Editar"
			btnCancel.classList.toggle("hidden");
		});

		setTimeout(()=>{
			this.element?.classList.remove('animate-expand-horizontal');
		}, 2000);
		//TODO: Agregar boton de Guardar y Comprimir item
	}
	toggleView(txtBtn: string, hasEdit: boolean) {
			if (!this.element) return;	
		const profileItem = this.element.querySelector(`#profile-item-${this.props.id}`);
		if (!profileItem)
			return;
		const btn = this.element.querySelector(`#profile-edit-${this.props.id}`);

		const btnBack = this.element.querySelector(`#profile-btn-back-${this.props.id}`);
		const avatar = this.element.querySelector(`#avatar-profile-${this.props.id}`);
		if (!(btn &&btnBack&& avatar)) return ;
		profileItem.classList.toggle("space-y-6");
		profileItem.classList.toggle("flex-col");
		avatar.classList.toggle("w-7");
		avatar.classList.toggle("h-7");
		avatar.classList.toggle("w-[4rem]");
		avatar.classList.toggle("h-[4rem]");
		btnBack.classList.toggle("hidden");
		this.props.hasEdit = hasEdit;
		btn.innerHTML = txtBtn;

	}

}