import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Setup2FA = () => {
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const setup2FA = async () => {
            try {
                const response = await axios.post('/api/setup-2fa', {}, {
                    headers: {
                        Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`
                    }
                });
                setQrCode(response.data.qrCode);
                setSecret(response.data.secret);
            } catch (error) {
                setError('Error al configurar 2FA');
            }
        };

        setup2FA();
    }, []);

    // Actualizado handleVerify para usar nuevos tokens
    const handleVerify = async () => {
        try {
            const response = await axios.post('/api/verify-2fa', { // Cambiado a /api/verify-2fa
                userId: JSON.parse(localStorage.getItem('user') || '{}').userid, // Obtener userId de localStorage
                code: verificationCode // Usar verificationCode del estado
            }, {
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem('accessToken')}`
                }
            });
            
            // No se guardan nuevos tokens aquí, solo se confirma la verificación
            alert('2FA configurado correctamente');
            navigate('/profile');
        } catch (error) {
            setError('Código incorrecto');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-96">
                <h2 className="text-2xl font-bold text-white mb-6">Configurar Autenticación en Dos Pasos</h2>
                
                {qrCode && (
                    <>
                        <div className="mb-4 flex justify-center">
                            <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                        </div>
                        <p className="text-gray-300 mb-4">
                            Escanea este código QR con tu aplicación de autenticación (Google Authenticator, Authy, etc.)
                        </p>
                        <p className="text-gray-300 mb-4">
                            O ingresa manualmente este código: <strong className="text-white">{secret}</strong>
                        </p>
                        
                        <div className="mb-4">
                            <label className="block text-gray-300 mb-2">Código de verificación</label>
                            <input
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                className="w-full p-2 bg-gray-700 rounded text-white"
                                placeholder="123456"
                                maxLength={6}
                            />
                        </div>
                        
                        {error && <p className="text-red-500 mb-4">{error}</p>}
                        
                        <button
                            onClick={handleVerify}
                            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                            disabled={!verificationCode || verificationCode.length !== 6}
                        >
                            Verificar y Activar 2FA
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default Setup2FA;