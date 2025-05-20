import { fetchUser } from './auth';
import { Navigation } from './components/Navigation/Navigation';
import ChatView from './pages/chat/ChatView';
import { GamePage } from './pages/game/GamePage';
import { LogInPage } from './pages/login/login';
import { StatsPage } from './pages/stats/StatsPage';
import { mount } from './utils/component';
window.addEventListener('hashchange', handleRoute);
window.addEventListener('DOMContentLoaded', handleRoute); // Ejecutar al cargar también
let navbar = null;
async function handleRoute() {
    let user = {
        user: '3'
    };
    const hash = window.location.hash;
    const env = await fetch('/env').then(res => res.json());
    if (env.env === 'production') {
        user = await fetchUser();
        console.log('user', user);
        if (!user && hash !== '#login') {
            loadLoginPage();
            return;
        }
    }
    const chatContainer = document.querySelector('#chat-container');
    if (chatContainer.childElementCount === 0) {
        loadChatContainer(user?.user || '3', '/images/henry_deco.svg');
    }
    if (!navbar) {
        navbar = new Navigation({
            items: [
                { text: 'Home', url: '#home', active: true },
                { text: 'Game', url: '#game' },
                { text: 'Stats', url: '#stats' },
                { text: 'Profile', url: '#profile' }
            ],
        });
        mount(navbar, '#header');
    }
    switch (hash) {
        case '#game':
            navbar.changeActiveItem('#game');
            loadGamePage();
            break;
        case '#stats':
            navbar.changeActiveItem('#stats');
            loadStatsPage();
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
function loadChatContainer(userId, avatarUrl) {
    const chatView = new ChatView(userId, avatarUrl);
    mount(chatView, '#chat-container');
}
function loadProfilePage() {
    const targetContainer = document.querySelector('#app');
    while (targetContainer.firstChild) {
        targetContainer.removeChild(targetContainer.firstChild);
    }
}
function loadGamePage() {
    /*const targetContainer:HTMLElement = document.querySelector('#app') as HTMLElement;
      while (targetContainer.firstChild) {
      targetContainer.removeChild(targetContainer.firstChild);
    }*/
    const gamePage = new GamePage();
    mount(gamePage, '#app');
}
function loadLoginPage() {
    const headerContainer = document.querySelector('#header');
    while (headerContainer.firstChild) {
        headerContainer.removeChild(headerContainer.firstChild);
    }
    const chatContainer = document.querySelector('#chat-container');
    while (chatContainer.firstChild) {
        chatContainer.removeChild(chatContainer.firstChild);
    }
    const loginPage = new LogInPage();
    mount(loginPage, '#app');
}
function loadHomePage() {
    const targetContainer = document.querySelector('#app');
    while (targetContainer.firstChild) {
        targetContainer.removeChild(targetContainer.firstChild);
    }
}
//# sourceMappingURL=main.js.map