import { Navigation } from './components/Navigation/Navigation';
import { UserJwt } from './data/UserJwt';
import ChatView from './pages/chat/ChatView';
import { GamePage } from './pages/game/GamePage'
import { StatsPage } from './pages/stats/StatsPage';
import { mount } from './utils/component';
import { ProfilePage } from './pages/profile/ProfilePage';
import { AuthPage } from './pages/auth/AuthPage';
import { NewPasswordPage } from './pages/auth/NewPasswordComponent';
// Establecer color del tema del usuario desde localStorage o usar color por defecto
const userColor = localStorage.getItem('user-theme-color') || '#3b82f6';
document.documentElement.style.setProperty('--user-theme-color', userColor);

window.addEventListener('hashchange', handleRoute);
window.addEventListener('DOMContentLoaded', handleRoute); // Ejecutar al cargar también

let navbar: Navigation | null = null;

let currentUser: UserJwt | null = null;




//TODO: 
export async function fetchUser(): Promise<UserJwt | null> {
  if (currentUser) return currentUser;
  try {
	const response = await fetch(
	  "https://localhost:8443/backend/api/validate-token",
	  {
		method: "GET",
		credentials: "include",
	  }
	);
	if (!response.ok) {
	  throw new Error("Network response was not ok");
	}
	const body = await response.json();
	console.log("Body: " + JSON.stringify(body, null, 2))
	if (body.decoded.purpose === "2fa_verification"){
		return null;
	}
	const data: {valid:boolean, decoded:UserJwt} = body;
	return (data.valid)? data.decoded:null;
  } catch (error) {
    
  }
  return null;
}

async function handleRoute() {
  let user: UserJwt | null = {
    id: '1',
    avatar: '',
    user: '3'
  };
  
  const hash = window.location.hash;
  const [route, queryString] = hash.split('?');

  user = await fetchUser();

  
  if (route.includes("newPassword")) {
      loadNewPasswordPage(queryString);
      return ;
  } else if (!user) {
    loadLoginPage();
    return;
  }
  const chatContainer: HTMLElement = document.querySelector('#chat-container') as HTMLElement;
  if (chatContainer.childElementCount === 0) {
    loadChatContainer(user?.user || '3', '/images/henry_deco.svg');
  }

  if (!navbar) {
    navbar = new Navigation(
      {
        items: [
          { text: 'Juego', url: '#game', active: true },
          { text: 'Dashboard', url: '#stats' },
          { text: 'Profile', url: '#profile' }
        ],
      }
    );
    mount(navbar, '#header');
  }
  switch (route) {
    case '#game':
      navbar.changeActiveItem('#game');
      loadGamePage(user);
      break;
    case '#stats':
      navbar.changeActiveItem('#stats');
      loadStatsPage()
      break;
    case '#profile':
      navbar.changeActiveItem('#profile');
      loadProfilePage();
      break;
    default:
      window.location.hash = "#game";
      break;
  }

}


function loadStatsPage() {
  const statsPage = new StatsPage();
  mount(statsPage, '#app');
}



function loadChatContainer(userId: string, avatarUrl: string) {
  const chatView = new ChatView(userId, avatarUrl);
  mount(chatView, '#chat-container');
}

function loadProfilePage() {

 const profilePage = new ProfilePage();
 mount(profilePage, '#app');
}
function loadGamePage(user: UserJwt) {

  const gamePage = new GamePage(user);
  mount(gamePage, '#app');

}
function loadNewPasswordPage(queryString:string) {
  const params = new URLSearchParams(queryString);
  const token = params.get('token');
  const email = params.get('email');

  if (email && token ){
    const newPasswordPage = new NewPasswordPage({token: token, email: email});
    mount(newPasswordPage, '#app');
  } else { 
    window.location.hash = 'home';
  }
}


function loadLoginPage() {
  const headerContainer:HTMLElement = document.querySelector('#header') as HTMLElement;
	while (headerContainer.firstChild) {
    headerContainer.removeChild(headerContainer.firstChild);
  }
  const chatContainer:HTMLElement = document.querySelector('#chat-container') as HTMLElement;
	while (chatContainer.firstChild) {
    chatContainer.removeChild(chatContainer.firstChild);
  }
  const loginPage = new AuthPage();
  mount(loginPage, '#app');
  
}


/**
 * Animacion
 */
document.addEventListener('change', () => {
  document.querySelectorAll(".ripple").forEach((button) => {
    (button as HTMLElement).addEventListener("click", (e: MouseEvent) => {
      const target = e.currentTarget as HTMLElement;

      // Eliminar ripple anterior si existe
      const existingRipple = target.querySelector(".ripple-effect");
      if (existingRipple) {
        existingRipple.remove();
      }

      // Crear nuevo span
      const circle = document.createElement("span");
      const diameter = Math.max(target.clientWidth, target.clientHeight);
      const radius = diameter / 2;

      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - target.getBoundingClientRect().left - radius}px`;
      circle.style.top = `${e.clientY - target.getBoundingClientRect().top - radius}px`;
      circle.classList.add("ripple-effect");

      target.appendChild(circle);
    });
  });
})

