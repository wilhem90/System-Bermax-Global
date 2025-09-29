// useUser.js
import { useContext } from 'react';
import UserContext from './ProviderUser'; // ✅ default import

export default function useUser() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error('useUser must be used within a ProviderUser');
  }

  return context;
}
