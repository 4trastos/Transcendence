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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await axios.post(
                "/api/register", 
                formData,
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            alert("Registro exitoso: " + response.data.message);
            setFormData({username: "", email: "", password: ""});

            // Redirige a login después del registro
            navigate("/login");
            
            if (formRef.current) {
                formRef.current.reset();
            }
            
            // Opcional: Resetear el formulario usando la ref
            if (formRef.current) {
                formRef.current.reset();
            }
        } catch (error: any) {
            console.error("Error detallado:", error);
            if (error.response?.status === 502) {
                alert("Error de conexión con el servidor. Por favor intenta nuevamente.");
            } else {
                alert("Error al registrar el usuario: " + 
                    (error.response?.data?.error || error.message));
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