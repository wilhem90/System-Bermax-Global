import { Navigate } from 'react-router-dom';
import useAuth from './UseAuth';
import Load from '../components/loading/Load';

export default function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Load message="Verificando sessão..." />;
  }
  
  if (user) {
    return <Navigate to="/home" replace />;
  }

  return children;
}
