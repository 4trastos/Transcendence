import { useState, useContext } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from './App'; // Importa el contexto

const Profile = () => {

    return (
        <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 px-6 py-12">
        {/* CARD PRINCIPAL */}
        <div className="bg-gray-900 p-10 shadow-2xl rounded-b-2xl w-full max-w-2xl space-y-8">
          
          {/* HEADER - Imagen de perfil y Nombre */}
          <div className="flex flex-col items-center space-y-4">
            <img
              src=""
              alt="Imagen de Perfil"
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-500"
            />
            <div className="border-2 border-white px-6 py-2">
              <h1 id="username" className="text-4xl font-bold text-white tracking-wide">
                Nombre de usuario
              </h1>
            </div>
          </div>
  
          {/* User Stats */}
          <div className="text-center">
            <h3 className="text-3xl font-bold text-blue-400">Stats de usuario</h3>
            <div className="mt-3 text-lg text-gray-300 space-y-1">
              <div>
                <span className="font-semibold text-white">Torneos Ganados:</span>{" "}
                <span id="tournament_wins" />
              </div>
              <div>
                <span className="font-semibold text-white">Partidos Vs Ganados:</span>{" "}
                <span id="vs_wins" />
              </div>
            </div>
          </div>
  
          <hr className="border-gray-700" />
  
          {/* User Info */}
          <div className="text-center">
            <h3 className="text-3xl font-bold text-blue-400">Datos de usuario</h3>
            <div className="mt-3 text-lg text-gray-300 space-y-1">
              <div>
                <span className="font-semibold text-white">Nombre:</span>{" "}
                <span id="name" />
              </div>
              <div>
                <span className="font-semibold text-white">Apellido:</span>{" "}
                <span id="lastname" />
              </div>
              <div>
                <span className="font-semibold text-white">Email:</span>{" "}
                <span id="email" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};

export default Profile;