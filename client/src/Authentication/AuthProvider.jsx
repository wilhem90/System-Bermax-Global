import { createContext, useCallback, useEffect, useState } from 'react';
import requestApi from '../services/requestApi';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Restaurar usuário ao iniciar app
  // ✅ Função: Restaurar sessão ou renovar token
  // ✅ Logout
  const logout = useCallback(async () => {
    try {
      if (!user?.deviceid) {
        setLoading(true);
        await requestApi('logout', 'POST', { deviceid: user.deviceid });
      }
    } catch (e) {
      console.warn('Erro no logout:', e.message);
    } finally {
      setLoading(false);
    }

    localStorage.removeItem('userData');
    setUser(null);
  }, [user?.deviceid]);
  const isActiveUser = useCallback(async () => {
    setLoading(true);

    let stored = null;
    try {
      stored = JSON.parse(localStorage.getItem('userData'));
    } catch (e) {
      console.warn('Erro ao ler userData do localStorage:', e.message);
    }

    if (!stored?.token || !stored?.emailUser || !stored?.deviceid) {
      setLoading(false);
      return;
    }

    try {
      // Tenta obter dados do usuário com o token salvo
      const userRes = await requestApi(
        `users/get-user?emailUser=${encodeURIComponent(stored.emailUser)}`,
        'GET',
        { token: stored.token, deviceid: stored.deviceid }
      );
      if (!userRes.success) {
        throw new Error(userRes.message);
      }

      setUser({
        ...userRes.data,
        token: stored.token,
        emailUser: stored.emailUser,
        deviceid: stored.deviceid,
      });
    } catch (error) {
      // Se token expirou, tenta renovar
      if (error.message === 'jwt expired') {
        console.warn('Token expirado. Tentando renovar...');
        setLoading(true)
        try {
          const renewRes = await requestApi('users/login', 'POST', {
            emailUser: stored.emailUser,
            deviceid: stored.deviceid,
          });

          if (!renewRes.success) {
            throw new Error('Falha ao renovar token');
          }

          const userRes = await requestApi(
            `users/get-user?emailUser=${encodeURIComponent(stored.emailUser)}`,
            'GET',
            { token: renewRes.token, deviceid: stored.deviceid }
          );

          if (!userRes.success) {
            throw new Error(userRes.message);
          }

          const newUser = {
            ...userRes.data,
            token: renewRes.token,
            emailUser: stored.emailUser,
            deviceid: stored.deviceid,
          };

          localStorage.setItem('userData', JSON.stringify(newUser));
          setUser(newUser);
        } catch (renewError) {
          console.error('Erro ao renovar token:', renewError.message);
          logout(); // força logout se falha
        }
      } else {
        console.error('Erro ao restaurar usuário:', error.message);
        logout(); // outro erro → força logout
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    isActiveUser();
  }, [isActiveUser]);

  // ✅ Login com email/senha
  const Login = async (credentials) => {
    try {
      const { emailUser, passwordUser, expiresAt } = credentials;

      const deviceid =
        JSON.parse(localStorage.getItem('deviceid')) ||
        Math.floor(Math.random() * 100_999_999_999);

      setLoading(true);

      const loginRes = await requestApi('users/login', 'POST', {
        emailUser,
        passwordUser,
        expiresAt,
        deviceid,
      });

      if (!loginRes.success) {
        throw new Error(loginRes.message || 'Falha no login.');
      }

      const userRes = await requestApi(
        `users/get-user?emailUser=${encodeURIComponent(emailUser)}`,
        'GET',
        { token: loginRes.token, deviceid }
      );

      if (!userRes.success) {
        throw new Error('Erro ao carregar dados do usuário');
      }

      const fullUser = {
        ...userRes.data,
        token: loginRes.token,
        emailUser,
        deviceid,
      };

      localStorage.setItem('userData', JSON.stringify(fullUser));
      localStorage.setItem('deviceid', JSON.stringify(deviceid));
      setUser(fullUser);
    } catch (error) {
      throw new Error(error.message || 'Erro inesperado no login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, Login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
