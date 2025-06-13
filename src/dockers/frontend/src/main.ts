import { fetchUser } from './auth';
import { FloatingChatComponent } from './components/Floating/FloatingChatComponent';
import { Navigation } from './components/Navigation/Navigation';
import { UserJwt } from './data/UserJwt';
import ChatView from './pages/chat/ChatView';
import { HomePage } from './pages/home/home';
import { GamePage } from './pages/game/GamePage'
import { StatsPage } from './pages/stats/StatsPage';
import { mount } from './utils/component';
import { ProfilePage } from './pages/profile/ProfilePage';
import { GameStarter } from './pages/game/state/GameSate';
import { AuthPage } from './pages/auth/AuthPage';
import { NewPasswordPage } from './pages/auth/NewPasswordComponent';
window.addEventListener('hashchange', handleRoute);
window.addEventListener('DOMContentLoaded', handleRoute); // Ejecutar al cargar también

let navbar: Navigation | null = null;
async function handleRoute() {
  let user: UserJwt | null = {
    id: '1',
    user: '3'
  };
  
  const hash = window.location.hash;
  const [route, queryString] = hash.split('?');

  const env = await fetch('/env').then(res => res.json());
  user = await fetchUser();
  console.log('user', user);
  if (route.includes("newPassword")) {
      loadNewPasswordPage(queryString);
      return ;
  } else if (!user) {
    loadLoginPage();
    return;
  }
  const chatContainer: HTMLElement = document.querySelector('#chat-container') as HTMLElement;
  if (chatContainer.childElementCount === 0) {
    loadChatContainer(user?.id || '3', '/images/henry_deco.svg');
  }

  if (!navbar) {
    navbar = new Navigation(
      {
        items: [
          { text: 'Home', url: '#home', active: true },
          { text: 'Game', url: '#game' },
          { text: 'Stats', url: '#stats' },
          { text: 'Profile', url: '#profile' }
        ],
      }
    );
    mount(navbar, '#header');
  }

  switch (route) {
    case '#game':
      navbar.changeActiveItem('#game');
      loadGamePage();
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
      loadHomePage();
      navbar.changeActiveItem('#home');
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
  /*const targetContainer:HTMLElement = document.querySelector('#app') as HTMLElement;
	while (targetContainer.firstChild) {
    targetContainer.removeChild(targetContainer.firstChild);
  }*/
 const profilePage = new ProfilePage();
 mount(profilePage, '#app');
}
function loadGamePage() {
  /*const targetContainer:HTMLElement = document.querySelector('#app') as HTMLElement;
	while (targetContainer.firstChild) {
    targetContainer.removeChild(targetContainer.firstChild);
  }*/
  const gamePage = new GamePage();
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

function loadHomePage() {
  const targetContainer:HTMLElement = document.querySelector('#app') as HTMLElement;
	while (targetContainer.firstChild) {
    targetContainer.removeChild(targetContainer.firstChild);
  }
}