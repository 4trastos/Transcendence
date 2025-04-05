import { useState, useContext } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from './App';
import GoogleAuthButton from './components/GoogleAuthButton';

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
        setError(null);

        try {
            if (needs2FA && twoFACode && userId) {
                const verifyResponse = await axios.post("/api/verify-2fa", {
                    userId: userId,
                    code: twoFACode,
                    tempToken: sessionStorage.getItem('temp2FAToken')
                }, {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionStorage.getItem('accessToken')}`
                    }
                });

                return handleLoginSuccess(verifyResponse.data, verifyResponse.headers, playerData);
            }

            const response = await axios.post("/api/login", playerData, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data?.requires2FA) {
                setNeeds2FA(true);
                setUserId(response.data.userId);
                sessionStorage.setItem('temp2FAToken', response.data.tempToken);
                setIsSubmitting(false);
                return;
            }

            handleLoginSuccess(response.data, response.headers, playerData);
        } catch (error: any) {
            console.error("Error detallado:", error);
            setIsSubmitting(false);
            
            if (error.response?.data?.error === 'Código 2FA inválido') {
                setError('Código incorrecto. Por favor intenta nuevamente.');
            } else {
                alert("Error al iniciar sesión: " + 
                    (error.response?.data?.error || error.response?.statusText || "Error de conexión"));
            }
        }
    };

    const handleLoginSuccess = (responseData: any, headers: any, playerData: typeof player1Data) => {
        sessionStorage.setItem('accessToken', responseData.accessToken);
        
        const setCookieHeader = headers['set-cookie'];
        if (setCookieHeader) {}

        axios.defaults.headers.common['Authorization'] = `Bearer ${responseData.accessToken}`;
        
        const userData = {
            userid: responseData.user.id,
            username: playerData.username
        };
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);

        navigate("/");
    };

    const handleTokenRefresh = async () => {
        try {
            const refreshToken = document.cookie
                .split('; ')
                .find(row => row.startsWith('refreshToken='))
                ?.split('=')[1];

            const response = await axios.post('/api/refresh-token', { refreshToken });
            sessionStorage.setItem('accessToken', response.data.accessToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.accessToken}`;
            return true;
        } catch (error) {
            sessionStorage.removeItem('accessToken');
            document.cookie = 'refreshToken=; Max-Age=0';
            navigate('/login');
            return false;
        }
    };

    axios.interceptors.response.use(
        response => response,
        async error => {
            if (error.response?.status === 401 && error.config && !error.config._retry) {
                error.config._retry = true;
                const refreshed = await handleTokenRefresh();
                if (refreshed) {
                    return axios(error.config);
                }
            }
            return Promise.reject(error);
        }
    );

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
                <div className="mt-4">
                  <div className="relative flex items-center">
                    <div className="flex-grow border-t border-gray-600"></div>
                    <span className="flex-shrink mx-4 text-gray-300">o</span>
                    <div className="flex-grow border-t border-gray-600"></div>
                  </div>
                  
                  <div className="mt-4 flex justify-center">
                    <GoogleAuthButton />
                  </div>
                </div>
            </form>
        </div>
    );
};

export default Login;