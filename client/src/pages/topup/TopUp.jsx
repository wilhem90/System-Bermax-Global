import { Bounce, toast, ToastContainer } from 'react-toastify';
import useAuth from '../../Authentication/UseAuth';
import Invoice from '../../components/modal/scripts/Invoice.jsx';
import Load from '../../components/loading/Load';
import Navbar from '../../components/navBar/Navbar';
import Pintransaction from '../../components/modal/scripts/Pintransaction';
import Sidebar from '../../components/sideBar/Sidebar';
import requestApi from '../../services/requestApi';
import './TopUp.css';
import { useEffect, useReducer, useState } from 'react';

export default function TopUp() {
  const { user, Login } = useAuth();

  useEffect(() => {
    document.title = 'TopUp';
  }, []);

  const initialState = {
    countryName: '',
    operatorName: '',
    inputNumber: '',
    valueSelected: '',
    validateOnly: true,
  };

  function reducer(state, action) {
    switch (action.type) {
      case 'FIELD_CHANGE':
        return { ...state, [action.name]: action.value };
      case 'RESET_FIELDS':
        return {
          ...state,
          operatorName: '',
          inputNumber: '',
          valueSelected: '',
        };
      default:
        return state;
    }
  }

  const [state, dispatch] = useReducer(reducer, initialState);
  const [showAutoComplete, setShowAutoComplete] = useState('showAutoComplete');
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [operators, setOperators] = useState([]);
  const [values, setValues] = useState({});
  const [skuCode, setSkuCode] = useState(null);
  const [estimated, setEstimated] = useState(0);
  const [countryIso, setCountryIso] = useState(null);
  const [load, setLoad] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [transferId, setTransferId] = useState(null);
  const [statusTransaction, setStatusTransaction] = useState(null);
  const [showPin, setShowPin] = useState(false);
  const [pins, setPins] = useState([]);
  const [error, setError] = useState('');

  const countries = [
    { countryName: 'Haiti', MinimumLength: 11, MaximumLength: 11 },
    { countryName: 'Mexico', MinimumLength: 12, MaximumLength: 12 },
    { countryName: 'Dominican_Republic', MinimumLength: 11, MaximumLength: 11 },
    { countryName: 'Chile', MinimumLength: 11, MaximumLength: 13 },
    { countryName: 'Guyana', MinimumLength: 10, MaximumLength: 10 },
  ];

  // 🔄 Função que renova token se for "jwt expired"
  const handleJwtError = async (errMessage) => {
    if (errMessage?.includes('jwt expired')) {
      try {
        await Login({
          emailUser: user.emailUser,
          deviceid: user.deviceid,
        });
        toast.info('Sessão renovada. Tente novamente.');
      } catch (e) {
        toast.error('Erro ao renovar sessão. Faça login novamente.' + e);
      }
      return true;
    }
    return false;
  };

  async function handleChange(e) {
    let { name, value } = e.target;

    if (name === 'countryName') {
      setShowAutoComplete('showAutoComplete');
    }

    if (name === 'inputNumber') {
      const countrySelected = countries.find(
        (c) => c.countryName === state.countryName
      );
      value = value.replaceAll(' ', '');

      if (countrySelected) {
        const valid =
          value.length >= countrySelected.MinimumLength &&
          value.length <= countrySelected.MaximumLength;

        setIsPhoneValid(valid);

        if (valid) {
          dispatch({ type: 'FIELD_CHANGE', name, value });

          setOperators([]);
          setValues({});

          try {
            setLoad(true);
            const res = await requestApi(
              `topup/providers?AccountNumber=${value}`,
              'GET',
              { ...user }
            );

            if (!res.success && (await handleJwtError(res.message))) return;

            setOperators(res.Items || []);
            return;
          } catch (error) {
            if (await handleJwtError(error.message)) return;
            console.error(error.message);
          } finally {
            setLoad(false);
          }
        }
      }

      setIsPhoneValid(false);
    }

    dispatch({ type: 'FIELD_CHANGE', name, value });
  }

  async function handleOperatorChange(e) {
    const selected = e.target.value;

    dispatch({
      type: 'FIELD_CHANGE',
      name: 'operatorName',
      value: selected,
    });

    const op = operators.find((o) => o.Name === selected);
    if (!op) return;

    const code = op.ProviderCode;
    setCountryIso(op.CountryIso);

    try {
      setLoad(true);
      const res = await requestApi(
        `topup/products?AccountNumber=${state.inputNumber}&ProviderCodes=${code}`,
        'GET',
        { ...user }
      );

      if (!res.success && (await handleJwtError(res.message))) return;

      const nums = {};
      const items = Object.values(res?.Items?.[code] || []);

      if (items.length) {
        const item = items[0];
        const min = Number(item.minValue);
        const max = Number(item.maxValue);

        if (!isNaN(min) && min < max) {
          const sku = item.skuCode;
          for (let i = min; i <= max; i++) {
            nums[i] = sku;
          }
        } else {
          items.forEach((val) => {
            nums[val.sendValue] = val.skuCode;
          });
        }
      }

      setValues(nums);
    } catch (error) {
      if (await handleJwtError(error.message)) return;
      console.error(error.message);
    } finally {
      setLoad(false);
    }
  }

  function handleClickCountry(e) {
    const selected = e.target.textContent;
    setShowAutoComplete('hideAutoComplete');
    dispatch({ type: 'FIELD_CHANGE', name: 'countryName', value: selected });
    dispatch({ type: 'RESET_FIELDS' });
    setIsPhoneValid(false);
    setOperators([]);
    setValues({});
  }

  async function handleChangeValueClick(e) {
    const val = e.target.value;
    const selectedSkuCode = values[val];
    setSkuCode(selectedSkuCode);

    dispatch({ type: 'FIELD_CHANGE', name: 'valueSelected', value: val });

    const dataTopUp = {
      countryName: state.countryName,
      operatorName: state.operatorName,
      skuCode: selectedSkuCode,
      sendCurrencyIso: user.currencyIso,
      sendValue: val,
      receiveCurrencyIso: countryIso,
      accountNumber: state.inputNumber,
      transactionType: 'topup',
      validateOnly: true,
    };

    setPins([]);
    try {
      setLoad(true);
      const res = await requestApi('topup/create-topup', 'POST', {
        ...user,
        ...dataTopUp,
      });

      if (!res.success && (await handleJwtError(res.message))) return;

      setEstimated(res.data.amountReceived);
    } catch (error) {
      if (await handleJwtError(error.message)) return;
      console.error(error.message);
    } finally {
      setLoad(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (
      !state.countryName ||
      !isPhoneValid ||
      !state.inputNumber ||
      !state.operatorName ||
      !state.valueSelected
    ) {
      setError('Please fill in all fields correctly.');
      toast.warn(error || 'Verifique os campos.');
      return;
    }

    setShowPin(true);
  }

  useEffect(() => {
    async function finalize() {
      if (pins.length === 4) {
        const dataTopUp = {
          countryName: state.countryName,
          operatorName: state.operatorName,
          skuCode,
          sendCurrencyIso: user.currencyIso,
          sendValue: state.valueSelected,
          receiveCurrencyIso: countryIso,
          accountNumber: state.inputNumber,
          transactionType: 'topup',
          validateOnly: false,
          pinTransaction: pins,
        };

        try {
          setLoad(true);
          const res = await requestApi('topup/create-topup', 'POST', {
            ...user,
            ...dataTopUp,
          });

          if (!res.success) {
            if (await handleJwtError(res.message)) return;

            if (res.message.includes('Pin')) {
              setPins([]);
              toast.error(res.message);
            }

            return;
          }

          setEstimated(res.data.amountReceived);
          setTransferId(res.data.transferId);
          setStatusTransaction(res.data.statusTransaction);
          setShowPin(false);
          setShowInvoice(true);
        } catch (error) {
          if (await handleJwtError(error.message)) return;
          console.error(error.message);
        } finally {
          setLoad(false);
        }
      }
    }

    finalize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pins]);

  function toogleModalPin() {
    setShowPin(false);
  }

  function handleResetForm() {
    dispatch({ type: 'RESET_FIELDS' });
    setOperators([]);
    setValues({});
    setIsPhoneValid(false);
    setSkuCode(null);
    setEstimated(0);
  }

  return (
    <div className="container-home">
      <Sidebar />
      <div className="box-central">
        <Navbar />
        <form className="box-topup" onSubmit={handleSubmit}>
          <h1>Send TopUp</h1>

          {/* País */}
          <div className="box-countries box-input">
            <input
              type="text"
              name="countryName"
              placeholder="Country"
              onChange={handleChange}
              value={state.countryName}
              autoComplete="off"
            />
          </div>

          {/* AutoComplete País */}
          <div className={`box-autocomplete ${showAutoComplete}`}>
            {countries
              .filter((c) =>
                c.countryName
                  .toLowerCase()
                  .includes(state.countryName.toLowerCase())
              )
              .map((c) => (
                <p key={c.countryName} onClick={handleClickCountry}>
                  {c.countryName}
                </p>
              ))}
            {countries.filter((c) =>
              c.countryName
                .toLowerCase()
                .includes(state.countryName.toLowerCase())
            ).length === 0 && <p>No country found</p>}
          </div>

          {/* Telefone */}
          <div className="box-input">
            <input
              type="tel"
              name="inputNumber"
              value={state.inputNumber}
              onChange={handleChange}
              placeholder="Phone number"
            />
            {state.inputNumber && !isPhoneValid && (
              <p className="error">Phone invalid!</p>
            )}
          </div>

          {/* Operadora */}
          <div className="box-input">
            <select
              name="operatorName"
              value={state.operatorName}
              disabled={!operators.length}
              onChange={handleOperatorChange}
            >
              <option value="" disabled>
                {operators.length
                  ? 'Select operator'
                  : 'No operators available'}
              </option>
              {operators.map((op) => (
                <option key={op.ProviderCode} value={op.Name}>
                  {op.Name}
                </option>
              ))}
            </select>
          </div>

          {/* Valor */}
          <div className="box-input">
            <select
              name="valueSelected"
              value={state.valueSelected}
              disabled={!Object.keys(values).length}
              onChange={handleChangeValueClick}
            >
              <option value="" disabled>
                {Object.keys(values).length
                  ? 'Select value'
                  : 'No values available'}
              </option>
              {Object.keys(values).map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <p>
            Estimated: {countryIso} {estimated}
          </p>

          <div className="box-input">
            <button type="submit">Send TopUp</button>
          </div>
        </form>
      </div>

      {load && <Load />}

      {showInvoice && (
        <div className="box-invoice">
          <Invoice
            onClose={() => setShowInvoice(false)}
            amount={state.valueSelected}
            amountReceived={estimated}
            operatorName={state.operatorName}
            accountNumber={state.inputNumber}
            countryName={state.countryName}
            statusTransaction={statusTransaction}
            dateNow={new Date().toLocaleString('pt-br')}
            transactionId={transferId}
            sendCurrencyIso={user.currencyIso}
            receiveCurrencyIso={countryIso}
            onReset={handleResetForm}
          />
        </div>
      )}

      {showPin && (
        <Pintransaction
          onclose={toogleModalPin}
          valuePins={setPins}
          clearPin={pins}
        />
      )}

      <ToastContainer
        position="top-right"
        autoClose={5000}
        pauseOnFocusLoss
        pauseOnHover
        draggable
        transition={Bounce}
      />
    </div>
  );
}
