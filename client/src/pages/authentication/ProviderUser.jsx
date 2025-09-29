// ProviderUser.js
import { createContext, useEffect } from 'react';
import { useState } from 'react';
import requestApi from '../../../requestApi';

const UserContext = createContext(null); // default export below

export function ProviderUser({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser({
      nome: 'Wilhem Wundt',
      sobrenome: 'Maxime',
      token: 'dsmfmwoeoko3',
    });
  }, []);

  async function Login(emailUser, passwordUser, expiresAt) {
    const dataUser = await requestApi('users/login', 'POST', '', {
      emailUser,
      passwordUser,
      expiresAt,
      deviceid: '5665623265',
    });
    console.log(dataUser); // simulate login
  }

  return (
    <UserContext.Provider value={{ user, Login }}>
      {children}
    </UserContext.Provider>
  );
}

export default UserContext;
