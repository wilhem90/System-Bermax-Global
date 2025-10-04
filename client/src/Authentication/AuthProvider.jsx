import { createContext, useState, useEffect } from 'react';
import requestApi from '../services/requestApi';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Verifica login automático ao iniciar
  useEffect(() => {
    const fetchUser = async () => {
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (!userData) return;
      setUser(userData);
    };

    fetchUser();
  }, []);

  const Login = async (credentials) => {
    try {
      const { emailUser, passwordUser, expiresAt } = credentials;

      const deviceid =
        JSON.parse(localStorage.getItem('deviceid')) ||
        Math.floor(Math.random() * 100_999_999_999);
      const data = await requestApi('users/login', 'POST', {
        emailUser,
        passwordUser,
        expiresAt,
        deviceid,
      });

      if (!data.success) {
        throw new Error(data.message || 'Falha no login.');
      }

      const userData = {
        ...data,
        emailUser,
        deviceid,
      };

      localStorage.setItem('userData', JSON.stringify(userData));

      const userRes = await requestApi(
        `users/get-user?emailUser=${encodeURIComponent(emailUser)}`,
        'GET',
        { deviceid, token: data.token }
      );

      if (userRes.success) {
        setUser({
          ...user,
          ...userRes,
          deviceid,
        });
      } else {
        throw new Error('Erro ao carregar dados do usuário');
      }
    } catch (error) {
      // console.error('Login error:', error.message);
      throw new Error(error);
    }
  };

  const logout = async () => {
    try {
      await requestApi('logout', 'POST', { deviceid: user?.deviceid });
    } catch (e) {
      console.warn('Erro no logout:', e.message);
    }

    localStorage.removeItem('userData');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, Login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
