import { useState } from "react";
import axios from "axios";
import React from "react";

const Register = () => {
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
            const response = await axios.post("http://localhost:3000/api/register", formData);
            alert("Regsitro exitoso" + response.data.message);
            setFormData({username: "", email: "", password: ""});
        } catch (error: any) {
            alert ("Error al registrar el usuario: " + (error.reponse?.data?.error || error.message));
        }
    };

    return (
        <div
            className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600"
        >
            <form
                onSubmit={handleSubmit}
                className="bg-white p-8 shadow-x1 rounded-lg w-96 space-y-4"
            >
                <h2 className="text-3xl font-bold mb-4 text-center text-gray-800">Sign Up for PONG!</h2>

                <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Your email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
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