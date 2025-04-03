import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TwoFactorAuth = () => {
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleVerify = async () => {
        try {
            const response = await axios.post('/api/verify-2fa', {
                token: code,
                tempToken: localStorage.getItem('tempToken'),
                userId: localStorage.getItem('tempUserId')
            });
            
            localStorage.setItem('authToken', response.data.token);
            localStorage.removeItem('tempToken');
            localStorage.removeItem('tempUserId');
            
            navigate('/');
        } catch (error) {
            setError('Código inválido. Por favor intenta nuevamente.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-96">
                <h2 className="text-2xl font-bold text-white mb-6">Verificación en Dos Pasos</h2>
                
                {error && <p className="text-red-500 mb-4">{error}</p>}
                
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full p-2 mb-4 bg-gray-700 rounded text-white"
                    placeholder="Código de autenticación"
                />
                
                <button
                    onClick={handleVerify}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                    Verificar
                </button>
                
                <button
                    onClick={() => {
                        localStorage.removeItem('tempToken');
                        localStorage.removeItem('tempUserId');
                        navigate('/login');
                    }}
                    className="w-full mt-4 text-gray-300 hover:text-white"
                >
                    Volver al login
                </button>
            </div>
        </div>
    );
};

export default TwoFactorAuth;