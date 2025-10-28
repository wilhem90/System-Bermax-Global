import { Navigate } from 'react-router-dom';
import useAuth from './UseAuth';
import Load from '../components/loading/Load';

export default function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  // alert(loading)
  if (loading) {
    return <Load message="Verificando sessão..." />;
  }

  // Se estiver logado, redireciona para o painel (ou outra rota principal)
  if (user?.token) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
