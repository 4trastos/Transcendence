import React from 'react';
import Items from './Items'; // Importa el componente Items
import Register from './Register';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './styles.css';

const App = () => {
  return(
    <Router>
      <div>
        
        <nav>
          <ul>
            <li>
              <Link to="/">Inicio</Link> 
            </li>
            <li>
              <Link to="/registro">Registro</Link> 
            </li>
          </ul>
        </nav>
        <Routes>
          <Route path="/" element={<Items />} /> 
          <Route path="/registro" element={<Register />} /> 
        </Routes>
      </div>
    </Router>
  );
};

export default App;