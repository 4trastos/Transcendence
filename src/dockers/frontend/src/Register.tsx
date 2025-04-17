import { useState, useRef } from "react";
import axios, { AxiosError } from "axios";
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
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [scanComplete, setScanComplete] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await axios.post("/api/register", { ...formData, enable2FA }, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
    
            if (response.data.qrCode) {
                setQrCode(response.data.qrCode);
            } else if (response.data.message?.includes('registrado')) {
                alert("Registro exitoso. Se te ha enviado un Email de verificación. Por favor inicia sesión después de verificar tu cuenta.");
                navigate("/login");
            } else {
                alert("Registro exitoso: " + (response.data.message || "Operación completada"));
            }
    
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || 
                               error.response?.data?.message || 
                               error.message || 
                               "Error desconocido al registrar";
            alert("Error al registrar: " + errorMessage);
            
            if (error.response?.status === 403) {
                navigate("/login");
            }
        }
    };

    const handleScanComplete = () => {
        setScanComplete(true);
        alert("Configuración 2FA completada. Debes verificar tu cuenta antes de iniciar sesión.");
        navigate("/login");
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

                {qrCode && (
                    <div className="mt-4 text-center">
                        <p className="text-white">Escanea este código QR con Google Authenticator:</p>
                        <img src={qrCode} alt="Código QR para 2FA" className="mx-auto mt-2" />
                        <button
                            type="button"
                            onClick={handleScanComplete}
                            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition font-semibold mt-4"
                        >
                            Ya he realizado el escaneo
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
};

export default Register;