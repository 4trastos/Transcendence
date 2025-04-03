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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [needs2FA, setNeeds2FA] = useState(false);
    const [twoFACode, setTwoFACode] = useState("");

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

    const handle2FAChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setTwoFACode(e.target.value);
    };
    
    const handleSubmit = async (e: React.FormEvent, playerData: typeof player1Data) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Si necesita 2FA y tenemos código, verificar
            if (needs2FA && twoFACode) {
                const verifyResponse = await axios.post("/api/verify-2fa", {
                    userId: playerData.username,
                    code: twoFACode
                }, {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                return handleLoginSuccess(verifyResponse.data, playerData);
            }

            // Login normal
            const response = await axios.post("/api/login", playerData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // Si el backend indica que necesita 2FA
            if (response.data?.needs2FA) {
                setNeeds2FA(true);
                setIsSubmitting(false);
                return;
            }

            handleLoginSuccess(response.data, playerData);
        } catch (error: any) {
            console.error("Error detallado:", error);
            setIsSubmitting(false);
            
            if (error.response) {
                alert("Error al iniciar sesión: " + 
                    (error.response.data?.error || error.response.statusText));
            } else {
                alert("Error de conexión con el servidor");
            }
        }
    };

    const handleLoginSuccess = (responseData: any, playerData: typeof player1Data) => {
        // Guardar tokens
        if (responseData.token) {
            localStorage.setItem("jwt", responseData.token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${responseData.token}`;
            
            // Guardar refresh token en httpOnly cookie (mejor seguridad)
            document.cookie = `refreshToken=${responseData.refreshToken}; Secure; SameSite=Strict; path=/; max-age=${7 * 24 * 60 * 60}`;
        }
        
        // Guardar información de usuario
        if (!playerData.guestMode) {
            localStorage.setItem("user", JSON.stringify({
                id: responseData.userId,
                username: playerData.username
            }));
        } else {
            localStorage.setItem("user", JSON.stringify({
                id: "guest",
                username: "Invitado"
            }));
        }
        
        // Redirigir y recargar
        navigate("/");
        window.location.reload();
    };

    const handleResend2FACode = async () => {
        try {
            await axios.post("/api/resend-2fa", {
                username: player1Data.username
            });
            alert("Nuevo código 2FA enviado");
        } catch (error) {
            alert("Error al reenviar el código");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-500 to-indigo-600 space-x-10">
            <form
                onSubmit={(e) => handleSubmit(e, player1Data)}
                className="bg-gray-900 p-8 shadow-xl rounded-lg w-96 space-y-4"
            >
                <h2 className="text-3xl font-bold mb-4 text-center text-white">
                    {needs2FA ? "Verificación 2FA" : "Get Ready Player1!"}
                </h2>

                {!needs2FA ? (
                    <>
                        <input
                            type="text"
                            name="username"
                            id="username"
                            placeholder="Username"
                            value={player1Data.username}
                            onChange={handleChange}
                            className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                            disabled={player1Data.guestMode}
                        />
                        <input
                            type="password"
                            name="password"
                            id="password"
                            placeholder="Password"
                            value={player1Data.password}
                            onChange={handleChange}
                            className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                            disabled={player1Data.guestMode}
                        />
                        <label className="text-white flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="guestMode"
                                checked={player1Data.guestMode}
                                onChange={handleChange}
                            />
                            Jugar como invitado?
                        </label>
                    </>
                ) : (
                    <>
                        <p className="text-white text-center mb-4">
                            Ingresa el código de verificación enviado a tu método 2FA
                        </p>
                        <input
                            type="text"
                            name="2faCode"
                            placeholder="Código 2FA"
                            value={twoFACode}
                            onChange={handle2FAChange}
                            className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                        <button
                            type="button"
                            onClick={handleResend2FACode}
                            className="text-blue-400 hover:underline text-sm"
                        >
                            Reenviar código
                        </button>
                    </>
                )}

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition font-semibold"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Procesando..." : 
                     needs2FA ? "Verificar" : "Ready!"}
                </button>

                {!needs2FA && (
                    <p className="text-center text-white">
                        No tienes una cuenta?{" "}
                        <Link to="/registro" className="text-blue-400 hover:underline">
                            Regístrate aquí
                        </Link>
                    </p>
                )}
            </form>
        </div>
    );
};

export default Login;