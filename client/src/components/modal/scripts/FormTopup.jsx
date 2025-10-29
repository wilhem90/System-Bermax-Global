import { useEffect, useReducer, useState } from 'react';
import useAuth from '../../../Authentication/UseAuth';
import requestApi from '../../../services/requestApi';
import { toast } from 'react-toastify';
import Pintransaction from './Pintransaction';
import '../styles/FormTopup.css';
import Load from '../../loading/Load';
import Invoice from './Invoice';

export default function FormTopup() {
  const { user, handleJwtRefresh } = useAuth();

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
  const [load, setLoad] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [transferId, setTransferId] = useState(null);
  const [statusTransaction, setStatusTransaction] = useState(null);
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loadMessage, setLoaMessage] = useState('Loading...');
  const [receiveCurrencyIso, setReceiveCurrencyIso] = useState('');

  const countries = [
    {
      countryName: 'Haiti',
      MinimumLength: 11,
      MaximumLength: 11,
      receiveCurrencyIso: 'HTG',
    },
    {
      countryName: 'Mexico',
      MinimumLength: 12,
      MaximumLength: 12,
      receiveCurrencyIso: 'MXN',
    },
    {
      countryName: 'Dominican_Republic',
      MinimumLength: 11,
      MaximumLength: 11,
      receiveCurrencyIso: 'DOP',
    },
    {
      countryName: 'Chile',
      MinimumLength: 11,
      MaximumLength: 13,
      receiveCurrencyIso: 'CLP',
    },
    {
      countryName: 'Guyana',
      MinimumLength: 10,
      MaximumLength: 10,
      receiveCurrencyIso: 'GYD',
    },
  ];

  const dataTopUp = {
    receiveCountryName: state.countryName,
    operatorName: state.operatorName,
    sendCurrencyIso: user.currencyIso,
    receiveCurrencyIso,
    accountNumber: state.inputNumber,
    transactionType: 'topup',
    validateOnly: true,
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
        setReceiveCurrencyIso(countrySelected.receiveCurrencyIso);

        if (valid) {
          dispatch({ type: 'FIELD_CHANGE', name, value });

          setOperators([]);
          setValues({});

          try {
            let res;
            setLoad(true);
            setLoaMessage('Buscando aperadores...');
            res = await requestApi(
              `topup/providers?AccountNumber=${value}`,
              'GET',
              { ...user }
            );

            if (!res.success && res.message.includes('jwt expired')) {
              const { token } = await handleJwtRefresh();
              console.log(token);
              setLoaMessage('Buscando aperadores...');
              res = await requestApi(
                `topup/providers?AccountNumber=${value}`,
                'GET',
                { ...user, token }
              );
            }
            setOperators(res.Items || []);
            return;
          } catch (error) {
            console.error(error.message);
          } finally {
            setLoad(false);
            setLoaMessage('Loading...');
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

    try {
      let res;
      setLoad(true);
      setLoaMessage('Buscando valores...');
      res = await requestApi(
        `topup/products?AccountNumber=${state.inputNumber}&ProviderCodes=${code}`,
        'GET',
        { ...user }
      );
      if (!res.success && res.message.includes('jwt expired')) {
        const { token } = await handleJwtRefresh();
        res = await requestApi(
          `topup/products?AccountNumber=${state.inputNumber}&ProviderCodes=${code}`,
          'GET',
          { ...user, token }
        );
      }

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
      console.error(error.message);
    } finally {
      setLoad(false);
      setLoaMessage('Loading...');
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

    dataTopUp.skuCode = selectedSkuCode;
    dataTopUp.sendValue = val;
    try {
      let res;
      setLoad(true);
      setLoaMessage('Calculando...');
      res = await requestApi('topup/create-topup', 'POST', {
        ...user,
        ...dataTopUp,
      });
      if (!res.success && res.message.includes('jwt expired')) {
        const { token } = await handleJwtRefresh();
        res = await requestApi('topup/create-topup', 'POST', {
          ...user,
          token,
          ...dataTopUp,
        });
      }

      setEstimated(res.data.amountReceived);
    } catch (error) {
      if (await handleJwtRefresh(error.message)) return;
    } finally {
      setLoad(false);
      setLoaMessage('Loading...');
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

  async function finalize(pins) {
    if (pins.length === 4) {
      dataTopUp.skuCode = skuCode;
      dataTopUp.sendValue = state.valueSelected;
      dataTopUp.validateOnly = false;
      dataTopUp.pinTransaction = pins;

      console.log(dataTopUp);

      try {
        let res;
        setLoad(true);
        setLoaMessage('Finalizando a transação...');
        setShowPin(false);
        res = await requestApi('topup/create-topup', 'POST', {
          ...user,
          ...dataTopUp,
        });

        if (!res.success) {
          if (res.message.includes('Pin invalid')) {
            toast.error(res.message);
            setShowPin(true);
            return;
          }

          if (res.message.includes('jwt expired')) {
            const { token } = await handleJwtRefresh(
              user.emailUser,
              user.deviceid
            );
            res = await requestApi('topup/create-topup', 'POST', {
              ...user,
              token,
              ...dataTopUp,
            });

            if (res.success === true) {
              toast.success(res.message);
              setEstimated(res?.data?.amountReceived);
              setTransferId(res?.data?.transferId);
              setStatusTransaction(res?.data?.status);
              setShowPin(false);
              setShowInvoice(true);
              return;
            }
          }

          return;
        }
        if (res.success === true) {
          toast.success(res.message);
          setEstimated(res?.data?.amountReceived);
          setTransferId(res?.data?.transferId);
          setStatusTransaction(res?.data?.status);
          setShowPin(false);
          setShowInvoice(true);
          return;
        }
        toast.info(res.message);
      } catch (error) {
        console.error(error.message);
      } finally {
        setLoad(false);
        setLoaMessage('Loading...');
      }
    }
  }

  function toggleModalPin() {
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
    <>
      {!showPin && (
        <div className="modal-topup">
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
              Estimated:{' '}
              {receiveCurrencyIso &&
                parseFloat(estimated)?.toLocaleString('pt-br', {
                  style: 'currency',
                  currency: receiveCurrencyIso,
                })}
            </p>

            <div className="box-input">
              <button type="submit">Send TopUp</button>
            </div>
          </form>

          {load && <Load message={loadMessage} />}
        </div>
      )}

      {showInvoice && (
        <div className="box-invoice">
          <Invoice
            onClose={() => {
              handleResetForm();
              setShowInvoice(false);
            }}
            amount={state.valueSelected}
            typeTransaction="Topup"
            amountReceived={estimated}
            operatorName={state.operatorName}
            accountNumber={state.inputNumber}
            receiveCountryName={state.countryName}
            statusTransaction={statusTransaction}
            dateNow={new Date().toLocaleString('pt-br')}
            transactionId={transferId}
            sendCurrencyIso={user.currencyIso}
            receiveCurrencyIso={receiveCurrencyIso}
          />
        </div>
      )}

      {showPin && (
        <Pintransaction
          onClose={toggleModalPin}
          onConfirm={finalize}
          message={'Confirmação de recarga'}
        />
      )}
    </>
  );
}
