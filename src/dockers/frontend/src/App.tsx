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
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <div className="space-x-4">
        <div className="w-1/2 flex items-center justify-center bg-blue-100">
        <button 
            className="px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 font-jacquard"
            onClick={() => navigate('/login')}
        >
          Jugar VS
        </button>
        </div>
        <div className="w-1/2 flex items-center justify-center bg-red-100">
        <button className="px-6 py-3 bg-red-500 text-white rounded hover:bg-red-600 font-jacquard">
          Jurgar Torneo
        </button>
        </div>
      </div>
    </div>
  );
};

export default App;