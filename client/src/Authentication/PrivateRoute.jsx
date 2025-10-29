import { Navigate } from 'react-router-dom';
import useAuth from './UseAuth';
import Load from '../components/loading/Load';

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();


  if (loading) {
    return (
      <div>
        <Load message={'Verificando sessão...'} />
      </div>
    );
  }

  console.log(window.location.href)
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
