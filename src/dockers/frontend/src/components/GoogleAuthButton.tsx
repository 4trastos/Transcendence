import React from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';

declare global {
  interface Window {
    google: any;
  }
}

const GoogleAuthButton: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = React.useContext(AuthContext);

  const handleGoogleLogin = async (response: any) => {
    try {
      const res = await axios.post('/api/auth/google', {
        tokenId: response.credential
      }, {
        withCredentials: true
      });

      if (res.data.requires2FA) {
        sessionStorage.setItem('temp2FAToken', res.data.tempToken);
        navigate('/verify-2fa', { state: { userId: res.data.userId } });
        return;
      }

      sessionStorage.setItem('accessToken', res.data.accessToken);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      navigate('/');
    } catch (error) {
      console.error('Google login failed:', error);
      alert('Error al iniciar sesión con Google');
    }
  };

  React.useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: handleGoogleLogin
      });

      window.google.accounts.id.renderButton(
        document.getElementById('googleSignInButton'),
        { theme: 'outline', size: 'large' }
      );
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return <div id="googleSignInButton" />;
};

export default GoogleAuthButton;