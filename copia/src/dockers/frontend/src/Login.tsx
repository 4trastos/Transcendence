import { useState } from "react";
import axios from "axios";
import Register from './Register';
import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';

const Login = () => {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://localhost:3000/api/login", formData);

            alert("Inciio de sesion exitoso: " + response.data.message);
            setFormData({ username: "", password: ""});
        } catch (error: any){
            console.error("Error detallado:", error);
            alert("Error al iniciar sesion: " + (error.response?.data?.error || error.message));
        }
    };
    console.log("hola");
    return (
        <div
        	className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600"
        >
            <form
                onSubmit={handleSubmit}
                className="bg-gray-900 p-8 shadow-xl rounded-lg w-96 space-y-4"
            >
                <h2 className="text-3xl font-bold mb-4 text-center text-white">Log In to PONG!</h2>

                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition font-semibold"
                >
                    Log In!
                </button>
                <div className="mt-4 text-center">
                    <p className="text-white">
                        No tienes una cuenta?{" "}
                        <Link to="/registro" className="text-blue-400 hover:underline">
                            Regístrate aquí
                        </Link>
                        <Routes>
                            <Route path="/registro" element={<Register />}/>
                        </Routes>
                    </p>
                </div>
            </form>
        </div>
    );
}

export default Login;