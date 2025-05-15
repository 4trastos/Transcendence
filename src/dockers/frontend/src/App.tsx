import React from 'react';
import { useEffect, useState, createContext } from "react";
import { useNavigate } from 'react-router-dom';

interface User {
    id: string; // Cambio a id
    username: string;
}

export const AuthContext = createContext<{
  user: User | null;
  setUser: (user: User | null) => void;
}>({ user: null, setUser: () => {} });

const App: React.FC = () => {
    const navigate = useNavigate();

  return (    
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="w-4/5 p-6 bg-gray-600 border-4 border-black">
        <div className="flex space-x-6">
          
          {/* Div Jugar VS */}
          <div className="flex flex-col items-center justify-center w-1/2 p-4 bg-sky-500 border-4 border-black text-white">
            <h2 className="mb-4 text-lg">Div del Jugar Vs</h2>
            <button className="bg-yellow-400 text-black font-semibold px-4 py-2 border-2 border-white">
              Boton
            </button>
          </div>

          {/* Div Jugar Torneo */}
          <div className="flex flex-col items-center justify-center w-1/2 p-4 bg-red-600 border-4 border-black text-white">
            <h2 className="mb-4 text-lg">Div del Jugar Torneo</h2>
            <button className="bg-yellow-400 text-black font-semibold px-4 py-2 border-2 border-white">
              Boton
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;