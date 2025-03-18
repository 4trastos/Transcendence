import Index from './index'; // Importa el componente Items
import Register from './Register';
import Login from './Login';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './styles.css';
import React, { useState } from 'react';

const App = () => {
  // Estado para controlar el componente activo
  const [activeComponent, setActiveComponent] = useState('home');

  // Función para cambiar el componente activo
  const renderComponent = () => {
    switch (activeComponent) {
      case 'home':
        return <Index />;
      case 'login':
        return <Login />;
      case 'registro':
        return <Register />;
      default:
        return <Index />;
    }
  };

  return (
    <div className='bg-gray-800 min-h-screen text-white'>
      {/* Barra de Navegación */}
      <nav className='p-4'>
        <ul className='flex space-x-4 justify-center'>
          <li>
            <button
              onClick={() => setActiveComponent('home')}
              className="text-gray-300 hover:text-white transition duration-300"
            >
              Inicio
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveComponent('login')}
              className="text-gray-300 hover:text-white transition duration-300"
            >
              Log in
            </button>
          </li>
          <li>
            <button
              onClick={() => setActiveComponent('registro')}
              className='text-gray-300 hover:text-white transition duration-300'
            >
              Registro
            </button>
          </li>
        </ul>
      </nav>

      {/* Contenido dinámico */}
      <div id="root" className="p-4">
        {renderComponent()}
      </div>
    </div>
  );
};

export default App;