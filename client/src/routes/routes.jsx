import { createBrowserRouter, Navigate } from 'react-router-dom';
import Home from '../pages/home/Home.jsx';
import Profile from '../pages/profil/Profile.jsx';
import About from '../pages/about/About.jsx';
import TopUp from '../pages/topup/TopUp.jsx';
import Money from '../pages/money/Money.jsx';
import AuthenticUser from '../pages/credencial/AuthenticUser.jsx';
import PrivateRoute from '../Authentication/PrivateRoute.jsx';
import PublicRoute from '../Authentication/PublicRoute.jsx';

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Navigate to="/home" replace />,
    },
    {
      path: '/login',
      element: (
        <PublicRoute>
          <AuthenticUser />
        </PublicRoute>
      ),
    },
    {
      path: '/home',
      element: (
        <PrivateRoute>
          <Home />
        </PrivateRoute>
      ),
    },
    {
      path: '/profile',
      element: (
        <PrivateRoute>
          <Profile />
        </PrivateRoute>
      ),
    },
    {
      path: '/about',
      element: (
        <PrivateRoute>
          <About />
        </PrivateRoute>
      ),
    },
    {
      path: '/send-topup',
      element: (
        <PrivateRoute>
          <TopUp />
        </PrivateRoute>
      ),
    },
    {
      path: '/send-money',
      element: (
        <PrivateRoute>
          <Money />
        </PrivateRoute>
      ),
    },
    {
      path: '*',
      element: <Navigate to="/home" replace />,
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
      v7_startTransition: true, // ✅ Add this line to remove the warning
    },
  }
);
