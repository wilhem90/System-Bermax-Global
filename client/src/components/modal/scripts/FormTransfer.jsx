import { useEffect, useState } from 'react';
import '../styles/FormTransfer.css';
import requestApi from '../../../services/requestApi';
import Load from '../../loading/Load';
import { toast } from 'react-toastify';
import useAuth from '../../../Authentication/UseAuth';
import Invoice from './Invoice';

export default function FormTransfer() {
  const [sendValue, setSendValue] = useState(70);
  const [operatorName, setOperatorName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [fullNameBeneficiary, setFullNameBeneficiary] = useState('');
  const [estimtePrice, setEstimatePrice] = useState(0);
  const [load, setLoad] = useState(false);
  const { user, handleJwtRefresh } = useAuth();
  const [showInvoice, setShowInvoice] = useState(false);
  const [transacationRef, setTransacationRef] = useState({});

  const formatCurrency = (value) => {
    if (!value || isNaN(value)) return 'R$ 0,00';
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoad(true);

    try {
      if (!operatorName || !accountNumber || !fullNameBeneficiary) {
        alert('Preencha todos os campos obrigatórios.');
        return;
      }
      let res;

      const dataTransfer = {
        sendValue: sendValue,
        accountNumber,
        operatorName,
        receiveCountryName: 'Haiti',
        fullNameBeneficiary,
        token: user.token,
        deviceid: user.deviceid,
        validateOnly: false,
      };

      let url = 'transfer/create-transaction';
      res = await requestApi(url, 'POST', dataTransfer);

      if (!res.success && res?.message?.includes('jwt expired')) {
        const { token } = await handleJwtRefresh();
        res = await requestApi(url, 'POST', {
          ...dataTransfer,
          token,
        });
      }

      if (res.success === true && !load) {
        toast.success('Transferência realizada com successo!');
        setShowInvoice(true);
        setTransacationRef({ ...res.data });
        return;
      }

      if (!load) return toast.warn(res.message);
    } catch (error) {
      console.log(error);
    } finally {
      setLoad(false);
    }
  };

  useEffect(() => {
    let timeoutId;

    async function getEstimateDelivery() {
      try {
        let res;
        let url = 'transfer/create-transaction';
        setLoad(true);
        res = await requestApi(url, 'POST', {
          ...user,
          sendValue: sendValue,
          token: user.token,
        });

        if (!res.success && res?.message?.includes('jwt expired')) {
          const { token } = await handleJwtRefresh();
          res = await requestApi(url, 'POST', {
            ...user,
            token,
            sendValue,
          });
        }
        if (!res.success) {
          return toast.error(res.message);
        }
        if (res?.estimated) {
          setEstimatePrice(res.estimated);
          return;
        }
      } catch (error) {
        console.error('Erro ao obter estimativa:', error);
      } finally {
        setLoad(false);
      }
    }

    if (sendValue >= 70) {
      timeoutId = setTimeout(() => {
        getEstimateDelivery();
      }, 2000);
    }

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendValue]);

  useEffect(() => {
    // Reset inicial quando o número mudar
    setOperatorName('');
    setFullNameBeneficiary('');

    const phoneRegex = /^\+?509\d{8}$/;

    if (!phoneRegex.test(accountNumber)) {
      return;
    }

    async function getBeneficiaryExist() {
      try {
        setLoad(true);
        const url = `transfer/get-beneficiary/${accountNumber}`;
        let res = await requestApi(url, 'GET', { ...user });

        if (!res.success && res?.message?.includes('jwt expired')) {
          const { token } = await handleJwtRefresh();
          res = await requestApi(url, 'GET', { ...user, token });
        }

        const beneficiary = res?.beneficiary;

        if (res.success && beneficiary) {
          setOperatorName(beneficiary.operatorName || '');
          setFullNameBeneficiary(beneficiary.fullNameBeneficiary || '');
        } else {
          // Reset se não houver dados
          setOperatorName('');
          setFullNameBeneficiary('');
        }
      } catch (error) {
        console.error('Erro ao buscar beneficiário:', error);
        // Reset também em caso de erro
        setOperatorName('');
        setFullNameBeneficiary('');
      } finally {
        setLoad(false);
      }
    }

    getBeneficiaryExist();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountNumber]);

  function handleResetForm() {
    setAccountNumber('');
    setEstimatePrice(0);
    setFullNameBeneficiary('');
    setOperatorName('Selecione operador');
    setSendValue(70);
  }

  return (
    <>
      <form className="back-ground-modal" onSubmit={handleSubmit}>
        {load && <Load message={'Espera...'} />}
        <div className="modal-form-transfer">
          <h3>Transferência</h3>
          <div className="modal-content">
            <div className="box-input">
              <input
                type="text"
                name="sendValue"
                id="sendValue"
                placeholder="Valor"
                inputMode="numeric"
                value={formatCurrency(sendValue)}
                required
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, '');
                  const numericValue = Number(value) / 100;
                  if (!isNaN(numericValue)) setSendValue(numericValue);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    setSendValue((prev) => {
                      const newValue = prev - 10;
                      return newValue >= 70 ? newValue : 70;
                    });
                  }

                  if (e.key === 'ArrowUp') {
                    setSendValue((prev) => {
                      const newValue = prev + 10;
                      return newValue <= 350 ? newValue : 350;
                    });
                  }
                }}
              />
            </div>

            <div className="box-input">
              <input
                type="tel"
                name="accountNumber"
                id="accountNumber"
                placeholder="+509XXXXXXXX"
                autoComplete="tel"
                pattern="^\+?509[0-9]{8}$"
                title="Digite um número válido do Haiti (ex: +509XXXXXXXX)"
                required
                onInvalid={(e) =>
                  e.target.setCustomValidity(
                    'Número inválido! Use +509XXXXXXXX'
                  )
                }
                onInput={(e) => e.target.setCustomValidity('')}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
              />
            </div>

            <div className="box-input">
              <div className="box-select">
                <select
                  name="operators"
                  id="operators"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  required
                >
                  <option value="" defaultChecked disabled>
                    Selecione operador
                  </option>
                  <option value="Moncash Haiti">Moncash Haiti</option>
                  <option value="Natcash Haiti">Natcash Haiti</option>
                </select>
              </div>
            </div>

            <div className="box-input">
              <input
                type="text"
                name="fullNameBeneficiary"
                id="fullNameBeneficiary"
                placeholder="Nome completo do beneficiário"
                autoComplete="name"
                autoCapitalize="on"
                value={fullNameBeneficiary}
                onChange={(e) => setFullNameBeneficiary(e.target.value)}
                required
              />
            </div>

            <div className="box-estimated-value">
              <div className="span-estimated">
                Total estimado:{' '}
                {load ? 'Loading...' : formatCurrency(estimtePrice)}
              </div>
            </div>

            <button type="submit" className="btn-submit-transaction">
              Finalizar transferência
            </button>
          </div>
        </div>
      </form>

      {showInvoice && (
        <div className="box-invoice">
          <Invoice
            onClose={() => {
              handleResetForm();
              setShowInvoice(false);
            }}
            amount={sendValue}
            typeTransaction="Cash-money"
            amountReceived={transacationRef.receiveValue}
            operatorName={operatorName}
            accountNumber={accountNumber}
            receiveCountryName="Haiti"
            statusTransaction="Completed"
            dateNow={new Date(transacationRef.createdAt).toLocaleString('pt-br')}
            transactionId={transacationRef.transferId}
            sendCurrencyIso={user.currencyIso}
            receiveCurrencyIso={transacationRef.receiveCurrencyIso}
            fullNameBeneficiary={fullNameBeneficiary}
          />
        </div>
      )}
    </>
  );
}
