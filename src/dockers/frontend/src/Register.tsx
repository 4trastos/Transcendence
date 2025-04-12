import { useState, useRef } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom"; 

const Register = () => {
    const navigate = useNavigate();
    const formRef = useRef<HTMLFormElement>(null);
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
    });
    const [enable2FA, setEnable2FA] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await axios.post("/api/register", {...formData, enable2FA}, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data.message.includes('registrado')) {
                alert("Registro exitoso. Por favor inicia sesión después de verificar tu cuenta.");
                navigate("/login");
            } else {
                alert("Registro exitoso: " + response.data.message);
            }

        } catch (error: any) {
            if (error.response?.status === 403) {
                alert("Registro completado. Debes verificar tu cuenta antes de iniciar sesión.");
                navigate("/login");
            } else {
                alert("Error al registrar: " + (error.response?.data?.error || error.message));
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600">
            <form 
                ref={formRef}
                onSubmit={handleSubmit}
                className="bg-gray-900 p-8 shadow-xl rounded-lg w-96 space-y-4"
            >
                <h2 className="text-3xl font-bold mb-4 text-center text-white">
                    Sign Up for PONG!
                </h2>

                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Your email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                    minLength={8}
                />
                <label className="text-white flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={enable2FA}
                        onChange={() => setEnable2FA(!enable2FA)}
                    />
                    Habilitar autenticación en dos pasos (recomendado)
                </label>

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition font-semibold"
                >
                    Sign Up!
                </button>
            </form>
        </div>
    );
};

export default Register;