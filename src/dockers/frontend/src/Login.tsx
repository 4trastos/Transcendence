import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const navigate = useNavigate();

    const [player1Data, setPlayer1Data] = useState({
        username: "",
        password: "",
        guestMode: false
    });


    function clearTextBox() {
        const username = document.getElementById("username") as HTMLInputElement;
        const password = document.getElementById("password") as HTMLInputElement;
    
        username.value = "";
        password.value = "";
        username.disabled = true;
        password.disabled = true;
    }
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        const username = document.getElementById("username") as HTMLInputElement;
        const password = document.getElementById("password") as HTMLInputElement;
    
        if (checked) {
            clearTextBox();
        } else {
            username.disabled = false;
            password.disabled = false;
        }
    
        setPlayer1Data({
            ...player1Data,
            [name]: type === "checkbox" ? checked : value
        });
    };
    

    const handleSubmit = async (e: React.FormEvent, playerData: typeof player1Data) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://localhost:3000/api/login", playerData);
            alert("Inicio de sesión exitoso: " + response.data.message);
            navigate("/");
        } catch (error: any) {
            console.error("Error detallado:", error);
            alert("Error al iniciar sesión: " + (error.response?.data?.error || error.message));
        }
    };
    

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 space-x-10">
            {/* Formulario Jugador 1 */}
            <form
                onSubmit={(e) => handleSubmit(e, player1Data)}
                className="bg-gray-900 p-8 shadow-xl rounded-lg w-96 space-y-4"
            >
                <h2 className="text-3xl font-bold mb-4 text-center text-white">Get Ready Player1!</h2>

                <input
                    type="text"
                    name="username"
                    id="username"
                    placeholder="Username"
                    value={player1Data.username}
                    onChange={(e) => handleChange(e, 1)}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <input
                    type="password"
                    name="password"
                    id="password"
                    placeholder="Password"
                    value={player1Data.password}
                    onChange={(e) => handleChange(e, 1)}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <label className="text-white flex items-center gap-2">
                    <input
                        type="checkbox"
                        name="guestMode"
                        checked={player1Data.guestMode}
                        onChange={(e) => handleChange(e, 1)}
                    />
                    Jugar como invitado?
                </label>
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition font-semibold"
                >
                    Ready!
                </button>
                <p className="text-center text-white">
                    No tienes una cuenta?{" "}
                    <Link to="/registro" className="text-blue-400 hover:underline">
                        Regístrate aquí
                    </Link>
                </p>
            </form>
        </div>
    );
};

export default Login;
