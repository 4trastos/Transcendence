import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App'; // Importa el componente App
import './styles.css';  // Importa el archivo CSS aquí

console.log('¡Hola, mundo!');

const root = createRoot(document.getElementById('root')!);
root.render(<App />);