import { Component, ComponentProps } from "../../utils/component";
import { ToastService } from "../../utils/toast";


export interface LogInProps extends ComponentProps {
	onCreateAccount: () => void;
	onRecoverPassword: () => void;
}

export class LogInComponent extends Component {
	protected props: LogInProps;
	private passwordInput: any;
	private usernameInput: any;
	private twoFAInput: any;
	private requiredTwoFA: boolean;

	constructor(props: LogInProps) {
		super();
		this.props = props;
		this.requiredTwoFA = false;
		this.template = `
		<div class="w-full h-full"> 
	<div 
		id="glow-box"
		class="relative flex justify-center items-center  w-full h-full  transition-all duration-300"
	>
		<!-- Glow Effect Layer -->
		<div class="pointer-events-none absolute inset-0 rounded-lg" 
				 style="
					 background: radial-gradient(
						 200px circle at var(--x) var(--y), 
						 rgba(255, 255, 255, 0.1), 
						 transparent 80%
					 );
					 z-index: 1;
					 transition: background 0.1s;
				 ">
		</div>

		<!-- Contenido encima -->
		<div class="relative z-10">

	<div class="pb-6 px-[10vw]">
			<h2 class="text-start text-white text-2xl font-regular mb-2 mt-2">¡Bienvenido!</h2>
			<label class="text-start text-white  font-regular mb-2 mt-2">
			¿No tienes una cuenta?
				<a id="create-account"
				href="javascript:void(0)" 
				class="underline font-bold text-white hover:text-blue-400">
				Create una nueva cuenta ahora
				</a>
			</label>
	</div>
 
	


<form id="login-form" class="space-y-6 px-[10vw]">
	<div class="space-y-4">

		<!-- Usuario -->
		<div class="mb-1">
			<div class="relative">
				<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
					<svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="7" r="4" />
						<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
					</svg>
				</div>
				<input type="text" name="username" placeholder="Usuario"
					class="autofill:bg-autofill appearance-none bg-black/5 text-white p-2 pl-10 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600"
					required />
			</div>
		</div>
		
		<!-- Contraseña -->
		<div class="mb-1">
			<div class="relative">

				<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
					<svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
						<path d="M7 11V7a5 5 0 0 1 10 0v4" />
					</svg>
				</div>
				<input type="password" name="password" placeholder="Contraseña"
					class="autofill:bg-autofill appearance-none bg-black/5 text-white p-2 pl-10 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600"
					required />
			</div>
		</div>
		
		<!-- 2FA -->
		<div id="input-twofa" class="hidden mb-1">
			<div class="relative">
				<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
					<svg fill="#9ca3af" class="h-5 w-5 text-gray-400"  viewBox="0 0 32 32" id="icon" xmlns="http://www.w3.org/2000/svg">
					<defs>
						<style>
						.cls-1 {
							fill: none;
						}
						</style>
					</defs>
					<polygon points="11 23.18 9 21.179 7.589 22.589 11 26 17 20 15.59 18.59 11 23.18"/>
					<path d="M28,30H24V28h4V16H24V8a4.0045,4.0045,0,0,0-4-4V2a6.0067,6.0067,0,0,1,6,6v6h2a2.0021,2.0021,0,0,1,2,2V28A2.0021,2.0021,0,0,1,28,30Z" transform="translate(0 0)"/>
					<path d="M20,14H18V8A6,6,0,0,0,6,8v6H4a2,2,0,0,0-2,2V28a2,2,0,0,0,2,2H20a2,2,0,0,0,2-2V16A2,2,0,0,0,20,14ZM8,8a4,4,0,0,1,8,0v6H8ZM20,28H4V16H20Z" transform="translate(0 0)"/>
					<rect id="_Transparent_Rectangle_" data-name="&lt;Transparent Rectangle&gt;" class="cls-1" width="32" height="32"/>
					</svg>

				</div>
				<input type="number" name="twofa" placeholder="Código 2FA"
					class="autofill:bg-autofill appearance-none bg-black/5 text-white p-2 pl-10 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600"
					/>
			</div>
		</div>

	</div>

	<div class="flex flex-col space-y-2">
		<!-- Botón de inicio de sesión -->
		<div class="w-full flex rounded-lg bg-gradient-animate  p-[1px] items-center justify-end">
			<div class="bg-[#11162F] w-full rounded-lg">
				<button type="submit" id="login-button" 
					class="ripple w-full  hover:bg-white/10 text-white py-2 px-6 rounded-lg">
					Iniciar Sesion
				</button>
			</div>
		</div>

		<div class="px-[5vw] py-1 w-full space-x-4 flex flex-row justify-center items-center">
			<div class="w-full bg-white bg-opacity-40 h-[1px]"></div>
				<label class="text-white"> O </label>
			<div class="w-full bg-white bg-opacity-40 h-[1px]"></div>
		</div>

		<div class="bg-white w-full rounded-lg">
			<button onclick="window.location.href='https://localhost:8443/backend/auth/google';"  id="login-google"   class="ripple w-full  hover:bg-black/10  py-2 px-6 text-black rounded-lg">
				Iniciar con Google
			</button>
		</div>

		<div class="h-fill flex flex-row space-x-0">
			<label class="text-white">¿Perdiste la contraseña?,
				<a id="recover-password" href="javascript:void(0)"
				class="underline font-bold text-white hover:text-blue-400">
				Clickea aqui
				</a>
			</label>
		</diV>
	</div>
</form>
</div>
	</div>
</div>
`;
	}
	public showInputError(input:any) {
		input.classList.remove("input-error");
		void input.offsetWidth;
		input.classList.add("input-error");
		setTimeout(() => {
			input.classList.remove("input-error");
		}, 3000);
	}

	protected initEvents(): void {
		if (!this.element) return;

		const glowBox: any = this.element.querySelector("#glow-box");

		const username = this.element.querySelector(`[name="username"]`) as HTMLFormElement;
		const password = this.element.querySelector(`[name="password"]`) as HTMLFormElement;
		const twoFA = this.element.querySelector(`[name="twofa"]`) as HTMLFormElement;
		if (username)
			this.usernameInput = username;
		if (username)
			this.passwordInput = password;
		if (twoFA)
			this.twoFAInput = twoFA;
		glowBox.addEventListener('mousemove', (e: any) => {
			const rect = glowBox.getBoundingClientRect();
			const x = ((e.clientX - rect.left) / rect.width) * 100;
			const y = ((e.clientY - rect.top) / rect.height) * 100;
			glowBox.style.setProperty('--x', `${x}%`);
			glowBox.style.setProperty('--y', `${y}%`);
		});
		const loginForm = this.element.querySelector(
			"#login-form"
		) as HTMLFormElement;
		const loginButton = this.element.querySelector(
			"#login-button"
		) as HTMLButtonElement;
		const createAccount = this.element.querySelector(
			"#create-account"
		) as HTMLButtonElement;
		const recoverPassword = this.element.querySelector(
			"#recover-password"
		) as HTMLButtonElement;

		if (loginForm && loginButton) {
			loginForm.addEventListener("submit", this.handleLogin.bind(this));
		}
		if (createAccount) {
			createAccount.addEventListener("click", () => {
				this.props.onCreateAccount();
			});
		}
		if (recoverPassword) {
			recoverPassword.addEventListener("click", () => {
				this.props.onRecoverPassword();

			});
		}
	}

	private async handleLoginTwoFA(formData: any): Promise<void>{
		const inputTwoFA = this.element?.querySelector('#input-twofa') as HTMLElement;
		const twofa = formData.get("twofa") as string;
		const loginButton = this.element?.querySelector('#login-button');
		const response = await fetch("https://localhost:8443/backend/api/verify-2fa", 
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					code: twofa,
				}),
				credentials: "include", // Incluir cookies en la solicitud
			}
		);

		if (response.ok) {
			this.requiredTwoFA = false;
			if (loginButton)
				loginButton.textContent = "Verificar código"
			const data = await response.json();
			window.location.reload();
			ToastService.show("¡Inicio de sesion exitoso!", "success");
		} else {
			ToastService.show("Error al iniciar sesion con 2FA", "error");
			this.showInputError(this.twoFAInput);
		}
	}

	private async handleLogin(event: Event): Promise<void> {
		event.preventDefault(); // Prevenir el envío del formulario por defecto
		let twofa;
		const formData = new FormData(event.target as HTMLFormElement);
		const username = formData.get("username") as string;
		const password = formData.get("password") as string;
		const loginButton = this.element?.querySelector('#login-button');
		const inputTwoFA = this.element?.querySelector('#input-twofa') as HTMLElement;
		twofa = formData.get("twofa") as string;
		const loginData = { username, password };

		try {
			let response = null;
			if (this.requiredTwoFA) {
				console.log("call to handleLoginTwoFAsro")
				this.handleLoginTwoFA(formData);
				return;
			} else { 
				response = await fetch("https://localhost:8443/backend/api/login",
					{
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify(loginData),
						credentials: "include", // Incluir cookies en la solicitud
					}
				);
			}

			if (response.ok) {
				const data = await response.json();
				console.log("Inicio de sesión exitoso:", data);
				//Todo: Redirigir a la página de inicio o chat
				if (data.requires2FA && inputTwoFA) {
					inputTwoFA.classList.toggle('hidden');
					this.requiredTwoFA = true;
					if (loginButton) {
						loginButton.textContent = "Verificar código"
					}
					ToastService.show("Es necesario el código 2FA", "success");
				} else {
					window.location.reload();
					ToastService.show("¡Inicio de sesion exitoso!", "success");
				}
				return ;
			} else if (response.status === 400) {
				ToastService.show("Credenciales inválidas", "error");
				this.showInputError(this.usernameInput);
			} else if (response.status === 403) {
				ToastService.show("Cuenta no verificada", "error");
				this.showInputError(this.usernameInput);
			} else if (response.status === 404) {
				ToastService.show("Usuario no encontrado", "error");
				this.showInputError(this.usernameInput);
			} else if (response.status === 401) {
				ToastService.show("Contraseña incorrecta", "error");
				this.showInputError(this.passwordInput);
			} else {
				ToastService.show("Error al hacer la peticion", "error");
				this.showInputError(this.passwordInput);
			}
		} catch (error) {
			ToastService.show("Error al hacer la peticion", "error");
			this.showInputError(this.usernameInput);
		}
	}
}
