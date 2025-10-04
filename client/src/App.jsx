import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './Authentication/AuthProvider.jsx';
import Home from './pages/home/Home.jsx';
import Profile from './pages/profil/Profile.jsx';
import About from './pages/about/About.jsx';
import PrivateRoute from './Authentication/PrivateRoute.jsx';
import useAuth from './Authentication/UseAuth.js';
import TopUp from './pages/topup/TopUp.jsx';
import Money from './pages/money/Money.jsx';
import AuthenticUser from './pages/credencial/AuthenticUser.jsx';

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      {/* Páginas públicas */}
      <Route
        path="/login"
        element={!user || {} ? <AuthenticUser /> : <Navigate to="/home" />}
      />

      {/* Páginas privadas */}
      <Route
        path="/home"
        element={
          <PrivateRoute>
            <Home />
          </PrivateRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        }
      />
      <Route
        path="/about"
        element={
          <PrivateRoute>
            <About />
          </PrivateRoute>
        }
      />
      <Route
        path="/send-topup"
        element={
          <PrivateRoute>
            <TopUp />
          </PrivateRoute>
        }
      />
      <Route
        path="/send-money"
        element={
          <PrivateRoute>
            <Money />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
