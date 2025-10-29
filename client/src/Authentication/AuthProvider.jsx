import {
  createContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import requestApi from '../services/requestApi';

async function storedUser() {
  return JSON.parse(localStorage.getItem('userData')) || {};
}

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Memoriza função para evitar recriação em cada render
  const refresDataUser = useCallback(async (waiting) => {
    const fullStored = await storedUser();
    const { token, deviceid, emailUser } = fullStored;

    if (!token || !deviceid || !emailUser) {
      setUser(null);
      return;
    }

    try {
      const res = await requestApi(
        `users/get-user?emailUser=${emailUser}`,
        'GET',
        {
          token,
          deviceid,
        }
      );

      if (!res.success && res.message.includes('jwt expired')) {
        const refresToken = await requestApi('users/login', 'POST', {
          emailUser,
          deviceid,
        });

        if (refresToken?.success) {
          setUser({ ...refresToken });
          localStorage.setItem(
            'userData',
            JSON.stringify({
              emailUser: refresToken?.emailUser,
              deviceid,
              token: refresToken?.token,
            })
          );
        }
      } else {
        setUser({ ...res.data, token });
      }
    } catch (error) {
      console.log(error);
    } finally {
      await waiting;
    }
  }, []);

  const handleJwtRefresh = useCallback(async () => {
    const fullStored = await storedUser();
    const refresToken = await requestApi('users/login', 'POST', {
      emailUser: fullStored?.emailUser || '',
      deviceid: fullStored?.deviceid || '',
    });

    if (refresToken.success) {
      setUser({ ...refresToken });
      localStorage.setItem(
        'userData',
        JSON.stringify({
          emailUser: refresToken?.emailUser,
          deviceid: fullStored?.deviceid,
          token: refresToken?.token,
        })
      );
    }
    return {
      token: refresToken.token,
    };
  }, []);

  useEffect(() => {
    async function getUserData() {
      try {
        setLoading(true);
        const fullStored = await storedUser();
        const { token, deviceid, emailUser } = fullStored;

        if (!token || !deviceid || !emailUser) {
          setUser(null);
          return;
        }

        const res = await requestApi(
          `users/get-user?emailUser=${emailUser}`,
          'GET',
          {
            token,
            deviceid,
          }
        );

        if (!res.success && res.message.includes('jwt expired')) {
          const refresToken = await requestApi('users/login', 'POST', {
            emailUser,
            deviceid,
          });

          if (refresToken?.success) {
            setUser({ ...refresToken });
            localStorage.setItem(
              'userData',
              JSON.stringify({
                emailUser: refresToken?.emailUser,
                deviceid,
                token: refresToken?.token,
              })
            );
          }
        } else {
          setUser({ ...res.data, token });
        }
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    }

    getUserData();
  }, []);

  const login = useCallback(async (credencials) => {
    try {
      const { emailUser, passwordUser, expiresAt } = credencials;
      if (!emailUser || !passwordUser) {
        return {
          success: false,
          message: {
            emailUser: 'joasislva@gmail.com',
            passwordUser: '123210',
            deviceid: '329dii3',
          },
        };
      }

      const deviceid =
        localStorage.getItem('deviceid') ||
        Math.floor(Math.random() * 100999999999);

      const userActive = await requestApi('users/login', 'POST', {
        emailUser,
        passwordUser,
        deviceid,
        expiresAt,
      });

      if (!userActive.success) {
        return userActive.message;
      }

      setUser(userActive);
      localStorage.setItem('deviceid', deviceid);
      localStorage.setItem(
        'userData',
        JSON.stringify({
          emailUser: userActive.emailUser,
          deviceid,
          token: userActive.token,
        })
      );
    } catch (error) {
      return error.message;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('userData');
    setUser([]);
  }, []);

  console.log(user)
  // Evita recriar esse objeto em todo render
  const contextValue = useMemo(
    () => ({
      login,
      user,
      logout,
      handleJwtRefresh,
      refresDataUser,
      loading,
    }),
    [login, user, logout, handleJwtRefresh, refresDataUser, loading]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export default AuthContext;
