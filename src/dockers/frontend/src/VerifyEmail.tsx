import { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

const VerifyEmail = () => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const { state } = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (state?.email) {
            axios.post('/api/send-verification', { email: state.email })
                .then(response => {
                    setMessage(`Código enviado a ${state.email}`);
                })
                .catch(error => {
                    setError(error.response?.data?.error || 'Error al enviar código');
                });
        }
    }, [state?.email]);

    const handleVerify = async () => {
        try {
            await axios.post('/api/verify-email', {
                token: code,
                email: state?.email
            });
            
            alert('¡Cuenta verificada con éxito!');
            navigate('/login');
        } catch (error) {
            setError(error.response?.data?.error || 'Código inválido');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-96">
                <h2 className="text-2xl font-bold text-white mb-6">Verificar Email</h2>
                
                {message && <p className="text-green-500 mb-4">{message}</p>}
                {error && <p className="text-red-500 mb-4">{error}</p>}
                
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full p-2 mb-4 bg-gray-700 rounded text-white"
                    placeholder="Código de verificación"
                />
                
                <button
                    onClick={handleVerify}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                    disabled={!code}
                >
                    Verificar
                </button>
            </div>
        </div>
    );
};