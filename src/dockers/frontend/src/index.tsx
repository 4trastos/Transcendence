import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App'
import './styles.css';  // Importa el archivo CSS aquí

console.log('¡Hola, mundo!');

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("No se encontró el elemento con ID 'root'")
}
const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)