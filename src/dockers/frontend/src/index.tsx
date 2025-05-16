import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App'; // Importa el componente App
import Login from './Login';
import './app.css';  // Importa el archivo CSS aquí
import Register from './Register';
import Pong from './Pong';
import Finish from './Finish';

console.log('¡Hola, mundo!');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<Register/>}/>
        <Route path="/pong" element={<Pong/>}/>
        <Route path="/endScreen" element={<Finish/>}/>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);