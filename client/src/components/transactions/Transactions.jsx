import {
  ArrowUpRight,
  Dices,
  Smartphone,
  ArrowUp,
  ArrowDown,
  SlidersHorizontal,
  Dot,
  ReceiptText,
  ArrowDownLeft,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import useAuth from '../../Authentication/UseAuth';
import requestApi from '../../services/requestApi';
import Invoice from '../modal/scripts/Invoice';
import './Transactions.css';
import Load from '../loading/Load';

export default function Transactions() {
  const { user, handleJwtRefresh, loading } = useAuth();

  const [data, setData] = useState([]);
  const [loadingFetch, setLoadingFetch] = useState(false);
  const [error, setError] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [inputSearch, setInputSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const typeList = {
    topup: 'Recarga celular',
    cashmoney: "Cash Money",
    deposit: 'Deposito em conta',
    FlyFund: 'Transferencia de dinheiro',
  };

  // 👉 Função para formatar data para o input (YYYY-MM-DD)
  function formatDateToInput(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 👉 useEffect para definir datas padrão ao montar o componente
  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    setStartDate(formatDateToInput(today));
    setEndDate(formatDateToInput(tomorrow));
  }, []);

  // 👉 Buscar transações
  async function fetchTransactions(isNextPage = false) {
    if (startDate && endDate && startDate > endDate) {
      setError('A data inicial não pode ser maior que a data final.');
      return;
    }

    if (!startDate || !endDate) return;

    const params = new URLSearchParams({
      startDate,
      endDate,
      emailUser: user.emailUser,
      pageSize: 10,
    });

    if (isNextPage && lastVisible) {
      params.append('lastCreatedAt', lastVisible);
    }

    setLoadingFetch(true);
    setError(null);

    try {
      const response = await requestApi(
        `topup/get-topups?${params.toString()}`,
        'GET',
        user
      );

      if (
        !response.success &&
        (response.message?.includes('jwt expired') ||
          response.message?.includes('jwt malformed'))
      ) {
        await handleJwtRefresh(user.emailUser, user.deviceid);
        return;
      }

      if (response.success && Array.isArray(response.items)) {
        setData((prev) =>
          isNextPage ? [...prev, ...response.items] : response.items
        );
        setLastVisible(response.lastVisible);
        setHasMore(response.items.length > 0);
      } else {
        setError(response?.message || 'Erro ao carregar transações.');
      }
    } catch (err) {
      setError('Erro inesperado: ' + err.message);
    } finally {
      setLoadingFetch(false);
    }
  }

  // 👉 Recarrega os dados ao alterar o período
  useEffect(() => {
    setData([]);
    setLastVisible(null);
    setHasMore(true);
    fetchTransactions(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  // 👉 Filtro de busca local
  const filteredData = data.filter((item) => {
    const search = inputSearch.toLowerCase();
    return (
      item.accountNumber?.toLowerCase().includes(search) ||
      item.productName?.toLowerCase().includes(search) ||
      item.createdBy?.toLowerCase().includes(search) ||
      item.statusTransaction?.toLowerCase().includes(search)
    );
  });

  return (
    <>
      {!loading && (
        <div className="recent-transactions">
          {/* Filtros de busca e data */}
          <div className="box-search">
            <input
              type="date"
              name="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <input
              type="date"
              name="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />

            <div className="box-input-svg">
              <input
                type="search"
                placeholder="Search"
                value={inputSearch}
                onChange={(e) => setInputSearch(e.target.value)}
              />
            </div>

            <div className="filter">
              <SlidersHorizontal />
              <span>Filter</span>
            </div>
          </div>

          <h2>Transações Recentes</h2>
          {error && <p className="error-message">{error}</p>}
          {loadingFetch && <Load message={'Carregando transações...'} />}

          <ul className="transaction-list">
            {filteredData.map((item) => (
              <li key={item.id} className="transaction-item">
                <div className="transaction-info">
                  <div
                    className={item.type === 'cash-out' ? 'cashOut' : 'cashIn'}
                  >
                    <span>
                      {item.type === 'cash-out' ? (
                        <ArrowUpRight />
                      ) : (
                        <ArrowDownLeft />
                      )}
                    </span>
                    <span style={{ marginLeft: '10px' }}>
                      {item.type === 'cash-out' ? 'Saída' : 'Entrada'}
                    </span>
                  </div>
                  <div className="transaction-details">
                    <h3>{typeList[item.productName.toLowerCase().replaceAll("-", "")]}</h3>
                    <p>
                      {new Date(item.createdAt).toLocaleString('pt-BR')}
                      {item.operatorName ? (
                        <>
                          <Dot /> {item.operatorName}
                        </>
                      ) : (
                        ''
                      )}{' '}
                      {item.accountNumber ? (
                        <>
                          <Dot /> Conta: {item.accountNumber}
                        </>
                      ) : (
                        ''
                      )}{' '}
                      <Dot />{' '}
                      <span className={item.status.toLowerCase()}>
                        {item.status}
                      </span>
                      <Dot />
                      <strong>
                        {parseFloat(item.sendValue).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: item.sendCurrencyIso || 'brl',
                        })}
                      </strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    console.log(item);
                    setSelectedTransaction(item);
                    setShowInvoice(true);
                  }}
                  title="Imprimir fatura"
                  className="show-invoice"
                >
                  <ReceiptText size={20} cursor={'pointer'} />
                </button>
              </li>
            ))}
            {/* Paginação real (botão) */}
            {hasMore && !loadingFetch && (
              <div className="load-more">
                <button onClick={() => fetchTransactions(true)}>
                  Carregar mais
                </button>
              </div>
            )}
          </ul>

          {/* Estatísticas */}
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-title">Total de Recargas</div>
                <div className="stat-icon">
                  <Smartphone size={30} />
                </div>
              </div>
              <div className="stat-value">42</div>
              <div className="stat-change increase">
                <ArrowUp size={30} /> 12% desde o mês passado
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-title">Apostas Realizadas</div>
                <div className="stat-icon">
                  <Dices size={30} />
                </div>
              </div>
              <div className="stat-value">18</div>
              <div className="stat-change increase">
                <ArrowUp size={30} /> 5% desde o mês passado
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-header">
                <div className="stat-title">Transferências</div>
                <div className="stat-icon">
                  <ArrowUpRight size={30} />
                </div>
              </div>
              <div className="stat-value">27</div>
              <div className="stat-change decrease">
                <ArrowDown size={30} /> 3% desde o mês passado
              </div>
            </div>
          </div>

          {/* Fatura (modal) */}
          {showInvoice && selectedTransaction && (
            <Invoice
              onClose={() => {
                setShowInvoice(false);
                setSelectedTransaction(null);
              }}
              amount={selectedTransaction.sendValue}
              amountReceived={selectedTransaction.receiveValue}
              operatorName={selectedTransaction.operatorName}
              accountNumber={selectedTransaction.accountNumber}
              fullNameBeneficiary={selectedTransaction.fullNameBeneficiary}
              receiveCountryName={selectedTransaction.receiveCountryName}
              statusTransaction={selectedTransaction.status}
              dateNow={new Date(selectedTransaction.createdAt).toLocaleString(
                'pt-BR'
              )}
              transactionId={selectedTransaction.id}
              sendCurrencyIso={selectedTransaction.sendCurrencyIso}
              receiveCurrencyIso={selectedTransaction.receiveCurrencyIso}
              typeTransaction={selectedTransaction.productName}
            />
          )}
        </div>
      )}
    </>
  );
}
