import { Component, ComponentProps } from "../../utils/component";

interface NewPasswordPageProps extends ComponentProps {
  token: string;
  email:string;
}


export class NewPasswordPage extends Component {
  protected props: NewPasswordPageProps;

  constructor(props: NewPasswordPageProps) {
    super();
    this.props = props;
    this.template = `
    <div class="w-screen h-screen"> 
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
      <div class="w-fit flex rounded-xl bg-gradient-animate shadow-lg  px-[5px] items-center justify-end">
        <div class="bg-[#11162F] w-fit p-6 rounded-xl">


          <div class="pb-6 px-6">
              <h2 class="text-start text-white text-2xl font-regular mb-2 mt-2">Cambiar contraseña</h2>
          </div>
        

          <form id="reset-password-form" class="space-y-6 px-6">
            <div class="space-y-4">

              <!-- Usuario -->
              <div class="mb-1">
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input type="password" name="password" placeholder="Nueva contraseña"
                    class="autofill:bg-autofill appearance-none bg-white/5 text-white p-2 pl-10 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600" required />
                </div>
              </div>
              <div class="mb-1">
                <div class="relative">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </div>
                  <input type="password" name="repit-password" placeholder="Confirmar nueva contraseña"
                    class="autofill:bg-autofill appearance-none bg-white/5 text-white p-2 pl-10 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600" required />
                </div>
              </div>
            </div>

            <div class="flex flex-col space-y-2">
              <!-- Botón de Reset contraseña -->
              <div class="w-full flex rounded-lg bg-gradient-animate  p-[1px] items-center justify-end">
                <div class="bg-[#11162F] w-full rounded-lg">
                  <button type="submit" id="reset-password" 
                    class="ripple w-full  hover:bg-white/10 text-white py-2 px-6 rounded-lg">
                    Guardar cambios
                  </button>
                </div>
              </div>
            </div>

          </form>
        </div>
      </div>
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
    const resetPassForm = this.element.querySelector(
      "#reset-password-form"
    ) as HTMLButtonElement;

    if (resetPassForm) {
      resetPassForm.addEventListener('submit', this.handleResetPassword.bind(this))

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
  private async handleResetPassword(event: Event): Promise<void> {
    event.preventDefault(); // Prevenir el envío del formulario por defecto
    const formData = new FormData(event.target as HTMLFormElement);
    const repitPassword = formData.get("repit-password") as string;
    const password = formData.get("password") as string;
    if (repitPassword !== password)
    {
      this.showTemporaryPasswordError("Las contraseñas no son iguales", '#repit-password');
      // Mostrar mensaje de error
      return ;
    }

    const response = await fetch(
      `https://localhost:8443/backend/api/reset-password?token=${this.props.token}&email=${this.props.email}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password:password }),
        credentials: "include", // Incluir cookies en la solicitud
      }
    );
    if (response.ok) {
      const data = await response.json();
      console.log("Cambio de contraseña exitoso:", data);
      //Todo: Redirigir a la página de inicio o chat
      window.location.hash = 'home';
    } else {
      this.showTemporaryPasswordError("La contraseña debe contener mínimo 8 caracteres, incluye letras y números", '#password');
    }
  }
}
