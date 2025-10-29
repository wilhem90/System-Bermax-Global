import { AuthProvider } from './Authentication/AuthProvider.jsx';
import { RouterProvider } from 'react-router-dom';
import './App.css';
import { Bounce, ToastContainer } from 'react-toastify';
import { router } from './Authentication/routes.jsx';

export default function App() {
  return (
    <>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        pauseOnFocusLoss
        pauseOnHover
        draggable
        transition={Bounce}
      />
    </>
  );
}
