import { createContext, useEffect, useState } from 'react';
import requestApi from '../services/requestApi';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // 🔐 Logout do usuário
  const logout = async () => {
    try {
      if (user?.deviceid) {
        setLoading(true);
        await requestApi('users/logout', 'POST', { deviceid: user.deviceid });
      }
    } catch (e) {
      console.warn('Erro no logout:', e.message);
    } finally {
      setLoading(false);
    }

    localStorage.removeItem('userData');
    setUser(null);
  };

  // 🔁 Restaurar usuário do localStorage ao iniciar app
  useEffect(() => {
    async function restoreUser() {
      setLoading(true);

      try {
        const storedUser = JSON.parse(localStorage.getItem('userData'));
        const storedDeviceId = localStorage.getItem('deviceid');

        if (
          !storedUser?.token ||
          !storedUser?.emailUser ||
          !storedUser?.deviceid
        ) {
          return;
        }

        setUser({
          ...storedUser,
          deviceid: storedUser.deviceid || storedDeviceId,
        });
      } catch (e) {
        console.warn('Erro ao restaurar usuário:', e.message);
      } finally {
        setLoading(false);
      }
    }

    restoreUser();
  }, []);

  // ✅ Login com email/senha
  const login = async (credentials) => {
    try {
      const { emailUser, passwordUser, expiresAt } = credentials;

      let deviceid =
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

      if (!loginRes.token) {
        throw new Error('Token não recebido. Login inválido.');
      }

      const fullUser = {
        ...loginRes,
        emailUser,
        deviceid,
      };

      localStorage.setItem('userData', JSON.stringify(fullUser));
      setUser(fullUser);
    } catch (error) {
      throw new Error(error.message || 'Erro inesperado no login');
    } finally {
      setLoading(false);
    }
  };

  // ♻️ Atualização do token JWT se expirado
  const handleJwtRefresh = async (errMessage, userLogged) => {
    const deviceid = localStorage.getItem('deviceid') || false;

    if (loading) {
      return;
    }

    if (errMessage?.includes('jwt expired')) {
      try {
        if (userLogged && userLogged.emailUser && deviceid) {
          const { emailUser } = userLogged;

          const response = await requestApi('users/login', 'POST', {
            emailUser,
            deviceid,
          });

          console.log(emailUser, deviceid);
          if (!response.success || !response.token) {
            throw new Error(response.message || 'Falha ao renovar o token.');
          }

          const updatedUser = { ...userLogged, token: response.token };
          setUser(updatedUser);

          localStorage.setItem('userData', JSON.stringify(updatedUser));
          return true;
        } else {
          toast.error('Usuário inválido. Faça login novamente.');
          window.location.reload();
          return false;
        }
      } catch (e) {
        toast.error(`Erro ao renovar sessão: ${e.message}`);
        localStorage.removeItem('userData');
        window.location.reload();
        return false;
      }
    }

    return false;
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, handleJwtRefresh, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;
