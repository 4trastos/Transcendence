import { Component, ComponentProps } from "../../utils/component";
import { ToastService } from "../../utils/toast";


export interface CreateAccountProps extends ComponentProps {
  onSignIn: () => void;
}

export class CreateAccountComponent extends Component {
  protected props;
  constructor(props: CreateAccountProps) {
    super();
    this.props = props;
    this.template = `
<div class="w-full h-full"> 
  <div 
    id="glow-box"
    class="relative flex justify-center items-center  w-full h-full  transition-all duration-300">
      <!-- Glow Effect Layer -->
    <div class="pointer-events-none absolute inset-0 rounded-lg" 
          style="
            background: radial-gradient(
              200px circle at var(--x) var(--y), 
              rgba(255, 255, 255, 0.1), 
              transparent 80%
            );
            z-index: 1;
            transition: background 0.1s;">
    </div>

        <!-- Contenido encima -->
    <div class="relative z-10">

        <div class="pb-6 px-[10vw]">
            <h2 class="text-start text-white text-2xl font-regular mb-2 mt-2">Registro</h2>

        </div>
      
        


      <form id="create-account-form" class="space-y-6 px-[10vw]">
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
              <input id="input-username" type="text" name="username" placeholder="Usuario"
                class="autofill:bg-autofill appearance-none bg-black/5 text-white p-2 pl-10 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600"
                required />
            </div>
          </div>
          <!-- Email -->
          <div class="mb-1">
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="7" r="4" />
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                </svg>
              </div>
              <input id="input-email" type="text" name="email" placeholder="Correo"
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
              <input id="input-password" type="password" name="password" placeholder"Contraseña"
                class="autofill:bg-autofill appearance-none bg-black/5 text-white p-2 pl-10 w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-600"
                required />
            </div>
          </div>

        </div>
          <div class="flex items-center mb-4">
              <input id="tfa-checkbox" type="checkbox" name="2fa" value="" class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded-sm focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600">
              <label for="tfa-checkbox" class="ms-2 text-sm font-medium text-white ">Habilitar 2FA</label>
          </div>
        

          <div id="component-qr-twofa" class="hidden mt-4 text-center space-y-2 flex flex-col">
            <p class="text-white">Escanea este código QR con Google Authenticator:</p>
            <img id="qr-image"  alt="Código QR para 2FA" class="mx-auto mt-2" />
            <div id="content-btn-scanned" class="w-full flex rounded-lg bg-gradient-animate  p-[1px] items-center justify-end">
              <div class="w-full rounded-lg">
                <button type="submit" id="btn-scanned" 
                  class="ripple w-full  hover:bg-black/10 text-white py-2 px-6 rounded-lg">
                  Ya he realizado el escaneo
                </button>
              </div>
            </div>
        </div>
        
        
        


        <div id="container-register">
        <div id="login-button" class="flex flex-col space-y-2">
          <!-- Botón de inicio de sesión -->
          <div class="w-full flex rounded-lg bg-gradient-animate  p-[1px] items-center justify-end">
            <div class="bg-[#11162F] w-full rounded-lg">
              <button type="submit" 
                class="ripple w-full  hover:bg-white/10 text-white py-2 px-6 rounded-lg">
                Registrarse
              </button>
            </div>
          </div>
        </div>

          <div class="px-[1vw] py-1 w-full space-x-4 flex flex-row justify-center items-center">
            <div class="w-full bg-white bg-opacity-40 h-[1px]"></div>
              <label class="text-white"> O </label>
            <div class="w-full bg-white bg-opacity-40 h-[1px]"></div>
          </div>

          <div class="bg-white rounded-lg">
            <button id="signUp-google"   class="ripple w-full  hover:bg-black/10  py-2 px-6 text-black rounded-lg">
              Inicia sesion con Google
            </button>
          </div>

          <div class="h-fill flex flex-row space-x-0">
            <label class="text-white">ir a ,
              <a id="back-login" href="javascript:void(0)"
              class="underline font-bold text-white hover:text-blue-400">
              Iniciar sesion
              </a>
            </label>
          </div>
        </div>
      </form>
    </div>
  </div>
</div>

`;
  }

  protected initEvents(): void {
    if (!this.element) return;

    const glowBox: any = this.element.querySelector("#glow-box");

    glowBox.addEventListener('mousemove', (e: any) => {
      const rect = glowBox.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      glowBox.style.setProperty('--x', `${x}%`);
      glowBox.style.setProperty('--y', `${y}%`);
    });
    const createForm = this.element.querySelector(
      "#create-account-form"
    ) as HTMLFormElement;
    const loginButton = this.element.querySelector(
      "#login-button"
    ) as HTMLButtonElement;
    const backLogin = this.element.querySelector(
      "#back-login"
    ) as HTMLButtonElement;

    const btnScanned = this.element?.querySelector('#btn-scanned') as HTMLButtonElement;
    if (btnScanned) {
      btnScanned.addEventListener("click", ()=> {
        this.handleScanComplete();
      });
    }
    if (createForm && loginButton) {
      createForm.addEventListener('submit', this.handleCreateAcc.bind(this))

    }
    if (backLogin) {
      backLogin.addEventListener("click", () => {
        this.props.onSignIn();
      })
    }

  }

  handleScanComplete ()  {
    ToastService.show("Configuración 2FA completada. Debes verificar tu cuenta antes de iniciar sesión.", "success");
    setTimeout(() => {
      window.location.reload();
    }, 1000);
};
  //TODO: HAY UN ERROR EN EL PATH, SE ENVIA EL FORMULARIO POR URL
  private async handleCreateAcc(event: Event): Promise<void> {
    event.preventDefault(); // Prevenir el envío del formulario por defecto
    const formData = new FormData(event.target as HTMLFormElement);
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const twoFA = this.element?.querySelector('#tfa-checkbox') as HTMLInputElement;
    const componentQrTFA = this.element?.querySelector('#component-qr-twofa') as HTMLElement;
    const containerRegister = this.element?.querySelector(
      "#container-register"
    ) as HTMLElement;
    const qrImage = this.element?.querySelector('#qr-image') as HTMLImageElement;
    const registerData = { username: username, email: email, password: password, enable2FA: twoFA.checked };
    
    const response = await fetch(
      "https://localhost:8443/backend/api/register",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
        credentials: "include", // Incluir cookies en la solicitud
      }
    );
    if (response.ok) {
      const data = await response.json();
      if (data.qrCode) {
        console.log(data.qrCode);
        qrImage.src = data.qrCode;
        componentQrTFA.classList.toggle("hidden");
        containerRegister.classList.toggle("hidden");
        //SI esta habilitado el QRCode debe mostar la imagen
      }
      console.log("Registro exitoso:", data);
      //Todo: Redirigir a la página de inicio o chat
      //window.location.reload();
    }
  }
}
