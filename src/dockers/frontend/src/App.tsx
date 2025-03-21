import React from 'react';
import Items from './Items'; // Importa el componente Items
import Pong from './Pong';
import Register from './Register';
import Login from './Login';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './styles.css';

const App = () => {
  return(
    <Router>
      <div className='bg-gray-800 min-h-screen text-white'>
        {/* Barra de Navegación */}
        <nav className='p-4'>
          <ul className='flex space-x-4 justify-center'>
            <li>
              <Link 
                to="/"
                className="text-gray-300 hover:text-white transition duration-300"
              >
                Inicio
              </Link> 
            </li>
            <li>
              <Link 
                to="/login"
                className='text-gray-300 hover:text-white transition duration-300'
              >
                Log in
              </Link> 
            </li>
            <li>
              <Link 
                to="/registro"
                className='text-gray-300 hover:text-white transition duration-300'
              >
                Registro
              </Link>
            </li>
          </ul>
        </nav>
        {/* Contenido dinamico segun la ruta */}
        <Routes>
          <Route path="/" element={<Pong />} /> 
          <Route path="/registro" element={<Register />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;