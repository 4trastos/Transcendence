import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import axios from "axios";
import Pong from "./Pong";
import Register from "./Register";
import Login from "./Login";

const App = () => {

  interface User {
    username: string;
    password: string;
  }

  const [user, setUser] = useState<User | null>(null);

  const checkSession = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        const response = await axios.get("http://localhost:3000/api/session", {
          withCredentials: true,
        });
        if (response.data.loggedIn) {
          setUser(response.data.user);
          localStorage.setItem("user", JSON.stringify(response.data.user));
        } else {
          setUser(null);
        }
      }
    } catch (error) {
        console.error("Error al comprobar la sesión:", error);
        setUser(null);
    }
};

  useEffect(() => {
    checkSession();
  }, []);

  const handleLogout = async () => {
    try {
        await axios.post("http://localhost:3000/api/logout", {}, {
            withCredentials: true // Asegura que la cookie de sesión se borre
        });
        setUser(null);
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    }
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