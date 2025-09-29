// App.jsx
import Auth from './pages/authentication/Auth';
import { ProviderUser } from './pages/authentication/ProviderUser';

function App() {
  return (
    <ProviderUser>
      <Auth />
    </ProviderUser>
  );
}

export default App;
