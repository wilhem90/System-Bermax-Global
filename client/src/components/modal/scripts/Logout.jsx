import { useState } from 'react';
import useAuth from '../../../Authentication/UseAuth';
import '../styles/Logout.css';
import { LogOut, X } from 'lucide-react';
import Load from '../../loading/Load';

export default function Logout({ openLogoutModal }) {
  const { logout } = useAuth();
  const [load, setLoad] = useState(false);

  const handleLogout = () => {
    setLoad(true);
    setTimeout(() => {
      setLoad(false);
      logout();
      window.location.reload();
    }, 3000);
  };

  return (
    <>
      {!load && (
        <div className="modal-overlay">
          <div className="logout-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Confirmação de Saída</h2>
              <button className="close-btn" onClick={openLogoutModal}>
                <X />
              </button>
            </div>

            <div className="modal-content">
              <div className="warning-icon">
                <LogOut onClick={openLogoutModal} />
              </div>
              <p>Tem certeza que deseja sair do sistema?</p>
            </div>

            <div className="modal-actions">
              <button className="cancel-btn" onClick={openLogoutModal}>
                Cancelar
              </button>
              <button className="confirm-btn" onClick={() => handleLogout()}>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
      {load && <Load message={'Logout...'} />}
    </>
  );
}
