import { useState, useContext, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from './App';

const Login = () => {
    const navigate = useNavigate();
    const { setUser } = useContext(AuthContext);
    const [player1Data, setPlayer1Data] = useState({
        username: "",
        password: "",
        guestMode: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [needs2FA, setNeeds2FA] = useState(false);
    const [twoFACode, setTwoFACode] = useState("");
    const [userId, setUserId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const tempTokenRef = useRef<string | null>(null);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        setError(null);
    
        try {
            // Modo invitado
            if (player1Data.guestMode) {
                setUser({ id: 'guest', username: 'Invitado' });
                navigate('/');
                return;
            }
    
            // Verificación 2FA
            if (needs2FA && twoFACode && userId) {
                if (twoFACode.length !== 6) {
                    setError("El código 2FA debe tener 6 dígitos.");
                    setIsSubmitting(false);
                    return;
                }
    
                console.log("🧪 Enviando verificación 2FA con código:", twoFACode);

                if (!tempTokenRef.current) {
                    console.error("No tempToken disponible para verificar 2FA");
                    setError("Error de autenticación, por favor inicie sesión nuevamente.");
                    setIsSubmitting(false);
                    return;
                }
    
                try {
                    console.log("📦 Enviando a verify-2fa:", {
                        code: twoFACode,
                        userId: userId,
                        tempToken: tempTokenRef.current,
                    });
                    
                    const response = await axios.post("/api/verify-2fa", {
                        code: twoFACode,
                        userId: userId,
                        tempToken: tempTokenRef.current,  // Añadimos el token al body
                    }, {
                        headers: {
                            'Authorization': `Bearer ${tempTokenRef.current}`,
                            'Content-Type': 'application/json'
                        }
                    });
    
                    console.log("✅ Respuesta de verify-2fa:", response.data);
                    setTwoFACode("");
                    return handleLoginSuccess(response.data);
                } catch (error: any) {
                    console.error("❌ Error en verify-2fa:", error.response?.data || error.message);
                    throw error;
                }
            }
    
            // Login normal
            const response = await axios.post("/api/login", player1Data);
            console.log("🔑 Respuesta de login:", response.data);
    
            if (response.data?.requires2FA) {
                setNeeds2FA(true);
                setUserId(response.data.user.id);  // Aseguramos que usamos response.data.user.id
                tempTokenRef.current = response.data.tempToken;
                setIsSubmitting(false);
                return;
            }
    
            handleLoginSuccess(response.data);
        } catch (error: any) {
            setIsSubmitting(false);
            setTwoFACode("");
            const errorMessage = error.response?.data?.error || 
                                error.response?.data?.message || 
                                error.message || 
                                'Error inesperado en la autenticación';
            setError(errorMessage);
            console.error("Error completo:", error.response?.data || error);
            localStorage.removeItem("accessToken");
        //    tempTokenRef.current = null;
        }
    };
    
    const handleLoginSuccess = (responseData: any) => {
        tempTokenRef.current = null;
        localStorage.setItem("accessToken", responseData.accessToken);
        localStorage.setItem("refreshToken", responseData.refreshToken);

        setUser({
            id: responseData.userId,
            username: player1Data.username
        });

        navigate("/");
    };

    const handleTokenRefresh = async () => {
        try {
            const refreshToken = document.cookie
                .split('; ')
                .find(row => row.startsWith('refreshToken='))
                ?.split('=')[1];

            const response = await axios.post('/api/refresh-token', { refreshToken });
            localStorage.setItem('accessToken', response.data.accessToken);
            return true;
        } catch (error) {
            localStorage.removeItem('accessToken');
            document.cookie = 'refreshToken=; Max-Age=0';
            navigate('/login');
            return false;
        }
    };

    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            response => response,
            async error => {
                if (error.config && error.response?.status === 401 && !error.config.url.includes('/api/verify-2fa')) {
                    const refreshed = await handleTokenRefresh();
                    if (refreshed) return axios(error.config);
                }
                return Promise.reject(error);
            }
        );
        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    useEffect(() => {
        console.log("tempToken actualizado:", tempTokenRef.current);
    }, [tempTokenRef.current]);

    const handleResend2FACode = async () => {
        try {
            if (!player1Data.username) {
                alert("Por favor ingresa tu nombre de usuario para reenviar el código.");
                return;
            }

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
                onSubmit={handleSubmit}
                className="bg-gray-900 p-8 shadow-xl rounded-lg w-96 space-y-4"
            >
                <h2 className="text-3xl font-bold mb-4 text-center text-white">
                    {needs2FA ? "Verificación 2FA" : "Get Ready Player1!"}
                </h2>

                {error && <p className="text-red-500">{error}</p>}

                {!needs2FA ? (
                    <>
                        <input
                            type="text"
                            name="username"
                            id="username"
                            placeholder="Username"
                            value={player1Data.username}
                            onChange={handleChange}
                            autoFocus
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
                            autoFocus
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