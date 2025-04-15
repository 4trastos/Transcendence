import { useState, useContext, useEffect, useRef } from "react";
import axios, { AxiosError, AxiosResponse } from "axios";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from './App';

interface LoginResponse {
    success: boolean;
    accessToken: string;
    refreshToken?: string;
    userId: number;
    username: string;
    requires2FA?: boolean;
    tempToken?: string;
    user?: any;
    error?: string;
}

interface AuthContextType {
    setUser: React.Dispatch<React.SetStateAction<{ id: string; username: string } | null>>;
}

interface Player1Data {
    username: string;
    password: string;
    guestMode: boolean;
}

interface Verify2FAResponse {
    success?: boolean;
    accessToken: string;
    refreshToken?: string;
    user: {
        id: number;
        username: string;
    };
    error?: string;
    message?: string;
}

interface Resend2FAResponse {
    message: string;
    error?: string;
}

const Login = () => {
    const navigate = useNavigate();
    const { setUser } = useContext(AuthContext) as AuthContextType;

    const [player1Data, setPlayer1Data] = useState<Player1Data>({
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
        const username = document.getElementById("username") as HTMLInputElement | null;
        const password = document.getElementById("password") as HTMLInputElement | null;
        if (username) {
            username.value = "";
            username.disabled = true;
        }
        if (password) {
            password.value = "";
            password.disabled = true;
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        const username = document.getElementById("username") as HTMLInputElement | null;
        const password = document.getElementById("password") as HTMLInputElement | null;

        if (checked) {
            clearTextBox();
        } else {
            if (username) username.disabled = false;
            if (password) password.disabled = false;
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
            if (player1Data.guestMode) {
                setUser({ id: 'guest', username: 'Invitado' });
                navigate('/');
                return;
            }
    
            if (needs2FA && twoFACode && userId !== null) {
                if (twoFACode.length !== 6) {
                    setError("El código 2FA debe tener 6 dígitos.");
                    setIsSubmitting(false);
                    return;
                }
    
                if (!tempTokenRef.current) {
                    setError("Error de autenticación, por favor inicie sesión nuevamente.");
                    setIsSubmitting(false);
                    return;
                }
    
                console.log("Enviando verificación 2FA con:", {
                    code: twoFACode,
                    tempToken: tempTokenRef.current.substring(0, 10) + "..."
                });
    
                const response = await axios.post("/api/verify-2fa", 
                    {
                        code: twoFACode,
                        tempToken: tempTokenRef.current
                    },
                    {
                        headers: {
                            'Authorization': `Bearer ${tempTokenRef.current}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
    
                console.log("Respuesta de verify-2fa:", {
                    status: response.status,
                    data: response.data
                });
    
                setTwoFACode("");
                return handleLoginSuccess(response.data);
            }
    
            const response = await axios.post("/api/login", player1Data);
            console.log("Respuesta de login:", {
                status: response.status,
                data: response.data
            });
    
            if (response.data.requires2FA) {
                setNeeds2FA(true);
                setUserId(response.data.userId);
                tempTokenRef.current = response.data.tempToken;
                setIsSubmitting(false);
                return;
            }
    
            handleLoginSuccess(response.data);
        } catch (error: any) {
            setIsSubmitting(false);
            setTwoFACode("");
            
            let errorMessage = 'Error inesperado en la autenticación';
            if (error.response) {
                console.error("Error response:", error.response.data);
                errorMessage = error.response.data?.error || 
                              error.response.data?.message || 
                              error.response.statusText;
            } else if (error.request) {
                errorMessage = "No se recibió respuesta del servidor";
            } else {
                errorMessage = error.message;
            }
            
            setError(errorMessage);
            console.error("Error completo:", error);
        }
    };
    
    const handleLoginSuccess = (responseData: {
        accessToken: string;
        refreshToken?: string;
        user?: { id: number; username: string };
        userId?: number;
    }) => {
        tempTokenRef.current = null;
        localStorage.setItem("accessToken", responseData.accessToken);
        
        if (responseData.refreshToken) {
            localStorage.setItem("refreshToken", responseData.refreshToken);
        }
    
        setUser({
            id: (responseData.user?.id || responseData.userId)?.toString() || '',
            username: responseData.user?.username || player1Data.username
        });
    
        navigate("/");
    };

    const handleTokenRefresh = async (): Promise<boolean> => {
        try {
            const refreshToken = document.cookie
                .split('; ')
                .find(row => row.startsWith('refreshToken='))
                ?.split('=')[1];

            if (!refreshToken) {
                navigate('/login');
                return false;
            }

            const response: AxiosResponse<{ accessToken: string }> = await axios.post('/api/refresh-token', { refreshToken });
            localStorage.setItem('accessToken', response.data.accessToken);
            return true;
        } catch {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            document.cookie = 'refreshToken=; Max-Age=0';
            navigate('/login');
            return false;
        }
    };

    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            response => response,
            async error => {
                if (error.config && error.response?.status === 401 && !error.config.url.includes('/api/verify-2fa') && !error.config.url.includes('/api/refresh-token')) {
                    const refreshed = await handleTokenRefresh();
                    if (refreshed) return axios(error.config);
                }
                return Promise.reject(error);
            }
        );
        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, [navigate]);

    const handleResend2FACode = async () => {
        try {
            if (!player1Data.username) {
                alert("Por favor ingresa tu nombre de usuario para reenviar el código.");
                return;
            }

            const response: AxiosResponse<Resend2FAResponse> = await axios.post("/api/resend-2fa", {
                username: player1Data.username
            });
            alert(response.data.message || "Nuevo código 2FA enviado");
        } catch (error: unknown) {
            let errorMessage = "Error al reenviar el código";
            if (axios.isAxiosError(error)) {
                errorMessage = error.response?.data?.error || error.message || errorMessage;
            } else if (error instanceof Error) {
                errorMessage = error.message || errorMessage;
            }
            alert(errorMessage);
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