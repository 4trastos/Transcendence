import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import axios from "axios";
import Pong from "./Pong";
import Register from "./Register";
import Login from "./Login";

const App = () => {

  interface User {
    userid: string;
    username: string;
  }

  const [user, setUser] = useState<User | null>(null);

  const checkSession = async () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
};

  useEffect(() => {
    checkSession();
  }, []);

  const handleLogout = async () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <Router>
      <div className="bg-gray-800 min-h-screen text-white">
        <div className="flex" style={{ flex: '0 0 10%' }}>
          <nav className='p-4 flex items-center justify-center'>
            <ul className="flex space-x-4">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition duration-300">
                  Inicio
                </Link>
              </li>
              {user ? (
                <>
                  <li>
                    <Link to="/perfil" className="text-gray-300 hover:text-white transition duration-300">
                      Perfil ({user.username})
                    </Link>
                  </li>
                  <li>
                    <button onClick={handleLogout} className="text-red-400 hover:text-red-300 transition duration-300">
                      Cerrar sesión
                    </button>
                  </li>
                </>
              ) : (
                <>
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
                </>
              )}
            </ul>
          </nav>
        </div>

        <div className="flex-1 overflow-auto">
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