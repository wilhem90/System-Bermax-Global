import { createBrowserRouter, Navigate } from 'react-router-dom';
import Home from '../pages/home/Home.jsx';
import Profile from '../pages/profil/Profile.jsx';
import About from '../pages/about/About.jsx';
import PrivateRoute from './PrivateRoute.jsx';
import PublicRoute from './PublicRoute.jsx';
import ManageAccount from '../pages/account/ManageAccount.jsx';
import AuthenticUser from '../pages/auth/AuthenticUser.jsx';
import TopUp from '../pages/topup/TopUp.jsx';
import Lottery from '../pages/lottery/Lottery.jsx';
import TransferMoney from '../pages/trasnfer/TransferMoney.jsx';

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Navigate to="/home" replace />,
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
      path: '/topup',
      element: (
        <PrivateRoute>
          <TopUp />
        </PrivateRoute>
      ),
    },
    {
      path: '/transfer',
      element: (
        <PrivateRoute>
          <TransferMoney />
        </PrivateRoute>
      ),
    },
    {
      path: '/lottery',
      element: (
        <PrivateRoute>
          <Lottery />
        </PrivateRoute>
      ),
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
      path: '/account',
      element: (
        <PrivateRoute>
          <ManageAccount />
        </PrivateRoute>
      ),
    },{
      path: '/profil',
      element: (
        <PrivateRoute>
          <Profile />
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
