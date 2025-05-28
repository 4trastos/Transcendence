import { Component, ComponentProps } from "../../utils/component";

export interface LoginPlayerProps extends ComponentProps {
  onComplete: (data:any) => void;
  onError: (err:any) => void;
  onLoading?: (loading:boolean) => void;
}

export class LoginPlayerComponent extends Component{
  protected props: LoginPlayerProps;
  constructor(props:LoginPlayerProps){
	super()
	this.props = props;
	this.template = this.renderTemplate();
  }
  
  renderTemplate() {
	return `
<!-- Contenido encima -->
<div  class="bg-[#11162F] relative z-10 pb-6 ">
  <div class="pb-6">
	<h1 class="text-center text-white text-md font-regular mb-2 mt-2">Iniciar Sesión</h1>
	<hr class="border-t border-white border-opacity-5" />
  </div>
  <form id="login-form" class="space-y-4 pl-16 pr-16">
	<!-- Usuario -->
	<div class="mb-1">
	  <div class="relative">
		<div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
		  <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
			<circle cx="12" cy="7" r="4" />
			<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
		  </svg>
		</div>
		<input type="text" name="username" placeholder="Username"
		  class="bg-white bg-opacity-5 text-white p-2 pl-10 w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600"
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
		<input type="password" name="password" placeholder="Password"
		  class="bg-white bg-opacity-5 text-white p-2 pl-10 w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-600"
		  required />
	  </div>
	</div>
	
	<!-- Botón de inicio de sesión -->
	<div class="w-full flex items-center justify-end">
	  <button type="submit" id="login-button" 
		class="w-fit border-white border  hover:bg-white/10 text-white font-regular py-2 px-6 rounded-full transition duration-300">
		Iniciar Session
	  </button>
	</div>
  </form>`;
  }
  protected initEvents(): void {
	if (!this.element) return;

	const loginForm = this.element.querySelector("#login-form") as HTMLFormElement;
	if (loginForm) {
	  loginForm.addEventListener("submit", this.handleLogin.bind(this));
	}
	
  }

	private async handleLogin(event: Event): Promise<void> {
	event.preventDefault(); // Prevenir el envío del formulario por defecto
	const formData = new FormData(event.target as HTMLFormElement);
	const username = formData.get("username") as string;
	const password = formData.get("password") as string;
	const loginData = { username, password };

	//La direccion tiene que se la del frontEnd.
	try {
	  const response = await fetch(
		"https://transcendence.42.fr/api/v1/auth/signin",
		{
		  method: "POST",
		  headers: {
			"Content-Type": "application/json",
		  },
		  body: JSON.stringify(loginData),
		  credentials: "include", // Incluir cookies en la solicitud
		}
	  );
	  if (response.ok) {
		const data = await response.json();
		console.log("Inicio de sesión exitoso:", data);
		this.props.onComplete(data);  
	  } else {
		this.props.onError(null);
	  }
	} catch(err) {
		this.props.onError(null);
	}


  }
}

