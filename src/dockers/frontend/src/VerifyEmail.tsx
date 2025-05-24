import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading'|'success'|'error'>('loading');
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        const email = searchParams.get('email');

        if (token && email) {
            axios.get(`/api/verify-email?token=${token}&email=${email}`)
                .then(() => {
                    setStatus('success');
                    setMessage('¡Email verificado con éxito!');
                    setTimeout(() => navigate('/login'), 3000);
                })
                .catch(error => {
                    setStatus('error');
                    setMessage(error.response?.data?.error || 'Error al verificar el email');
                });
        } else {
            setStatus('error');
            setMessage('Enlace de verificación inválido');
        }
    }, [searchParams, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-96 text-center">
                <h2 className="text-2xl font-bold text-white mb-6">
                    {status === 'loading' ? 'Verificando...' : 
                     status === 'success' ? '¡Verificación Exitosa!' : 'Error de Verificación'}
                </h2>
                
                <p className={`mb-4 ${
                    status === 'success' ? 'text-green-500' : 
                    status === 'error' ? 'text-red-500' : 'text-white'
                }`}>
                    {message}
                </p>
                
                {status === 'success' && (
                    <p className="text-white">Redirigiendo al login...</p>
                )}
            </div>
        </div>
    );
};

export default VerifyEmail;