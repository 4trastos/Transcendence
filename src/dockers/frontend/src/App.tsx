import React from 'react';
import Items from './Items'; // Importa el componente Items
import Pong from './Pong';
import Register from './Register';
import Login from './Login';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import bgImg from './assets/imgs/bg.png';
import './styles.css';

const App = () => {
  return (
    <Router>
      <div className="bg-gray-800 min-h-screen text-white flex flex-row">
        {/* Barra de Navegación (10% de la pantalla) */}
        <div className="h-full w-[10vh] p-4 flex items-center justify-center">
          <nav>
            <ul className="flex space-x-4">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition duration-300">
                  Inicio
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-300 hover:text-white transition duration-300">
                  Log in
                </Link>
              </li>
              <li>
                <Link to="/registro" className="text-gray-300 hover:text-white transition duration-300">
                  Registro
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        {/* Contenido dinámico (90% de la pantalla) */}
        <div
          className="h-full w-[90vh] overflow-auto"
          style={{
            backgroundImage: `url(${bgImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
          }}
        >
          <Routes>
            <Route path="/" element={<Pong />} />
            <Route path="/registro" element={<Register />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
