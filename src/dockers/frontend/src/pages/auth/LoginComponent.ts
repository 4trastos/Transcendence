import { Component, ComponentProps } from "../../utils/component";


export interface LogInProps extends ComponentProps {
  onCreateAccount: () => void;
  onRecoverPassword: () => void;
}

export class LogInComponent extends Component {
  protected props: LogInProps;
  constructor(props: LogInProps) {
    super();
    this.props = props;
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

  </div>

  <div class="flex flex-col space-y-2">
    <!-- Botón de inicio de sesión -->
    <div class="w-full flex rounded-lg bg-[linear-gradient(45deg,_#E615F2,_#1ADEF9)]  p-[1px] items-center justify-end">
      <div class="bg-[#11162F] w-full rounded-lg">
        <button type="submit" id="login-button" 
          class="w-full  hover:bg-white/10 text-white py-2 px-6 rounded-lg">
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
      <button type="submit" id="login-google"   class="w-full  hover:bg-black/10  py-2 px-6 text-black rounded-lg">
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

  protected initEvents(): void {
    if (!this.element) return;

	const glowBox:any = this.element.querySelector("#glow-box");

	glowBox.addEventListener('mousemove', (e:any) => {
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


  private async handleLogin(event: Event): Promise<void> {
    event.preventDefault(); // Prevenir el envío del formulario por defecto
    const formData = new FormData(event.target as HTMLFormElement);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const loginData = { username, password };

    const response = await fetch(
      "http://localhost:3000/api/login",
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
      //Todo: Redirigir a la página de inicio o chat
      window.location.reload();
    } else {

    }
  }
}
