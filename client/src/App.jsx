import { AuthProvider } from './Authentication/AuthProvider.jsx';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/routes.jsx'; // caminho ajustado
import "./App.css"

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
