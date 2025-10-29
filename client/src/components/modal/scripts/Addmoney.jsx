import { Minus, Plus, X } from 'lucide-react';
import '../styles/Addmoney.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bounce, toast, ToastContainer } from 'react-toastify';
import requestApi from '../../../services/requestApi';
import useAuth from '../../../Authentication/UseAuth';
import Load from '../../loading/Load';

export default function Addmoney() {
  const [amount, setAmount] = useState(50);
  const { user, handleJwtRefresh } = useAuth();
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [methodDeposit, setMethodDeposit] = useState('');
  const handleChange = (e) => {
    let value = e.target.value;

    // Remove caracteres não numéricos
    value = value.replace(/\D/g, '');

    // Converte para número e formata em reais
    const numericValue = Number(value) / 100;
    setAmount(numericValue);
  };
  const formatCurrency = (value) => {
    if (value === '' || isNaN(value)) return '';
    return parseFloat(value).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  async function handleCreateDeposit() {
    try {
      setLoadingFetch(true);
      const refDeposit = await requestApi('wallet/deposit', 'POST', {
        deviceid: user.deviceid,
        token: user.token,
        methodDeposit,
        amount,
      });

      console.log(refDeposit)
      if (!refDeposit.success) {
        if (
          refDeposit.message.includes('jwt expired') ||
          refDeposit.message.includes('jwt malformed')
        ) {
          await handleJwtRefresh(user.emailUser, user.deviceid);
          toast.info('Please try again!');
          return;
        }
      } else {
        toast.success(refDeposit.message);
        return;
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoadingFetch(false);
    }
  }

  const navigate = useNavigate();
  return (
    <>
      {loadingFetch && <Load />}
      {!loadingFetch && (
        <div className="box-add-money">
          <div className="body-add-money">
            <div className="header">
              <span className="title">Add Money</span>
              <button className="close-btn" aria-label="Close">
                <X size={20} onClick={() => navigate('/home')} />
              </button>
            </div>

            <div className="box-container">
              <div className="box-input-addMoney">
                <input
                  type="text"
                  name="amount-deposit"
                  id="amount-deposit"
                  placeholder="Insert amount"
                  value={formatCurrency(amount)}
                  onChange={handleChange}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      setAmount((prev) => {
                        if (prev / 2 >= 50) return prev - 50;
                        return prev;
                      });
                    }

                    if (e.key === 'ArrowUp') {
                      setAmount((prev) => {
                        return prev + 50;
                      });
                    }
                  }}
                />
                <div className="btn-plus-minus">
                  <button className="icon-btn">
                    <Minus
                      size={18}
                      onClick={() => {
                        setAmount((prev) => {
                          if (prev / 2 >= 50) return prev - 50;
                          return prev;
                        });
                      }}
                    />
                  </button>
                  <button className="icon-btn">
                    <Plus
                      size={18}
                      onClick={() => {
                        setAmount((prev) => {
                          return prev + 50;
                        });
                      }}
                    />
                  </button>
                </div>
              </div>

              <div className="method-deposit">
                <select
                  name="method-deposit"
                  id="method-deposit"
                  onChange={(e) => setMethodDeposit(e.target.value)}
                >
                  <option value="" disabled selected>
                    Select mehthod
                  </option>
                  <option value="PIX">Via pix</option>
                  <option value="BOLETO">Via boleto</option>
                </select>
              </div>
              <button
                type="submit"
                className="continue-btn"
                onClick={() => handleCreateDeposit()}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
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
