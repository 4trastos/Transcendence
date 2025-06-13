import { Component, ComponentProps } from "../../utils/component";


export interface RecoverPasswordProps extends ComponentProps {
  onSignIn: () => void;
}

export class RecoverPasswordComponent extends Component {
  protected props: RecoverPasswordProps;
  constructor(props: RecoverPasswordProps) {
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
      <h2 class="text-start text-white text-2xl font-regular mb-2 mt-2">Recuperar Contraseña</h2>
      <label class="text-start text-white  font-regular mb-2 mt-2">
        Te enviaremos un enlace para cambiar tu clave.
      </label>
  </div>
 
  


<form id="send-reset-form" class="space-y-6 px-[10vw]">
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
        <input id="email-input" type="text" name="email" placeholder="Correo"
          class="autofill:bg-autofill appearance-none bg-white/5 text-white p-2 pl-10 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600"
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
          Enviar Correo
        </button>
      </div>
    </div>


    <div class="h-fill flex flex-row space-x-0">
      <label class="text-white">ir a,
        <a id="back-login" href="javascript:void(0)"
        class="underline font-bold text-white hover:text-blue-400">
        iniciar sesion
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
      "#send-reset-form"
    ) as HTMLFormElement;
    const backLogin = this.element.querySelector(
      "#back-login"
    ) as HTMLButtonElement;

    if (backLogin) {
      backLogin.addEventListener("click", () => {
        this.props.onSignIn();
      });
    }
    if (loginForm ) {
          loginForm.addEventListener("submit", this.handleSendEmail.bind(this));
    }
  }

	showTemporaryPasswordError(msg: string, id:string) {
		if (!this.element) return;
		const input = this.element.querySelector(id) as HTMLInputElement | null;
		if (!input) return;
		input.setCustomValidity(msg);
		input.reportValidity(); // Muestra el mensaje de error
		setTimeout(() => {
			input.setCustomValidity("");
			input.reportValidity(); // Vuelve a evaluar, útil si el usuario no ha tocado el campo
		}, 3000);
	}


  private async handleSendEmail(event: Event): Promise<void> {
    event.preventDefault(); // Prevenir el envío del formulario por defecto
    const formData = new FormData(event.target as HTMLFormElement);
    const email = formData.get("email") as string;
    if (!email){
      this.showTemporaryPasswordError("Por favor ingrese un correo", '#email-input');
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:3000/api/send-reset-email-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: email }),
          credentials: "include",
        }
      );
      if (response.ok) {
          //TODO: hacer que muestre un mensaje de success
      } else {
          const errorData = await response.json();
          const message = errorData?.details || "Ocurrió un error al enviar el correo.";
        this.showTemporaryPasswordError(message, '#email');
      }
    } catch (err) {
        this.showTemporaryPasswordError("El email no existe", '#email-input');
    }
  }
}
