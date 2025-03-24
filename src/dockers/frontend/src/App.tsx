import React from 'react';
import Items from './Items'; // Importa el componente Items
import Pong from './Pong';
import Register from './Register';
import Login from './Login';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './styles.css';

const App = () => {
  return (
    <Router>
      <div className="bg-gray-800 min-h-screen text-white"> {/*className="bg-gray-800 min-h-screen text-white flex flex-row" */}
        {/* Barra de Navegación (10% de la pantalla) */}
        <div className="flex" style={{ flex: '0 0 10%'}}> {/*className="flex" style={{ flex: '0 0 10%' }}*/}
          <nav className='p-4 flex items-center justify-center'> {/*className='p-4 flex items-center justify-center'*/}
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
        <div className="flex-1 overflow-auto"> {/*className="flex-1 overflow-auto"*/}
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
