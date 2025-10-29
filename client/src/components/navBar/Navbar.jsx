import './Navbar.css';
import useAuth from '../../Authentication/UseAuth.js';
import { useState } from 'react';
import { Eye, EyeClosed } from 'lucide-react';
export default function Navbar() {
  const [showSoldeAccount, setShowSoldeAccount] = useState(false);
  let { user, loading, refresDataUser } = useAuth();
  const [load, setLoad] = useState(false);

  async function handleShowSolde() {
    setLoad(true)
    refresDataUser(waiting());
    setShowSoldeAccount((prev) => !prev);
  }

  function waiting() {
    setLoad(false);
  }

  return (
    <div className="welcome-banner">
      <div className="welcome-text">
        <h2>Olá, {user.firstNameUser || 'Cliente'} !</h2>
        <p>Aqui está o resumo das suas atividades</p>
      </div>
      <div className="balance-card">
        <div className="balance-label">
          Saldo Disponível
          {!loading && !load ? (
            showSoldeAccount ? (
              <div className="balance-amount" onClick={handleShowSolde}>
                {parseFloat(user?.soldeAccount).toLocaleString('pt-br', {
                  style: 'currency',
                  currency: user?.currencyIso,
                })}
              </div>
            ) : (
              <div className="balance-amount">*****</div>
            )
          ) : (
            'Loading...'
          )}
        </div>
        {showSoldeAccount ? (
          <Eye onClick={handleShowSolde} cursor={'pointer'} fontSize={'5rem'} />
        ) : (
          <EyeClosed onClick={handleShowSolde} cursor={'pointer'} />
        )}
      </div>
    </div>
  );
}
