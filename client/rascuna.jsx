import { useEffect, useState } from 'react';
import useAuth from '../../Authentication/UseAuth';
import requestApi from '../../services/requestApi';
import './Transactions.css';
import { ReceiptText, SlidersHorizontal } from 'lucide-react';
import Invoice from '../modal/scripts/Invoice.jsx';
import Load from '../loading/Load';

export default function Transactions() {
  const { user, handleJwtRefresh } = useAuth();

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
  
  // Buscar dados da API
  async function fetchTransactions(isNextPage = false) {
    if (startDate && endDate && startDate > endDate) {
      setError('A data inicial não pode ser maior que a data final.');
      return;
    }

    const start = startDate;
    const end = endDate;
    if (!start || !end) {
      return;
    }
    const url = new URLSearchParams({
      startDate: start,
      endDate: end,
      emailUser: user.emailUser,
      pageSize: 10,
    });

    if (isNextPage && lastVisible) {
      url.append('lastCreatedAt', lastVisible);
    }

    setLoadingFetch(true);
    setError(null);

    try {
      const response = await requestApi(
        `topup/get-topups?${url.toString()}`,
        'GET',
        user
      );

      if (
        !response.success &&
        (response.message.includes('jwt expired') ||
          response.message.includes('jwt malformed'))
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

  // Recarregar quando as datas mudarem
  useEffect(() => {
    setData([]);
    setLastVisible(null);
    setHasMore(true);
    fetchTransactions(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  // Filtro por texto
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
    <div className="box-transactions">
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

      {/* Conteúdo */}
      {loadingFetch && data.length === 0 ? (
        <Load message={'Carregando...'} />
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : filteredData.length === 0 ? (
        <p>Nenhuma transação encontrada.</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Conta</th>
                <th>Produto</th>
                <th>Enviado</th>
                <th>Recebido</th>
                <th>Status</th>
                <th>Email</th>
                <th>Fatura</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.createdAt).toLocaleString()}</td>
                  <td>{item.accountNumber}</td>
                  <td>{item.productName}</td>
                  <td>
                    {parseFloat(item.sendValue).toLocaleString('pt-br', {
                      style: 'currency',
                      currency: item.sendCurrencyIso,
                    })}
                  </td>
                  <td>
                    {parseFloat(item.receiveValue).toLocaleString('pt-br', {
                      style: 'currency',
                      currency: item.receiveCurrencyIso,
                    })}
                  </td>
                  <td
                    className={`invoice-td ${
                      [
                        'complete',
                        'completed',
                        'Complete',
                        'Completed',
                      ].includes(item.statusTransaction)
                        ? 'success'
                        : 'error'
                    }`}
                  >
                    {item.statusTransaction}
                  </td>
                  <td>{item.createdBy}</td>
                  <td>
                    <button
                      onClick={() => {
                        setSelectedTransaction(item);
                        setShowInvoice(true);
                      }}
                      title="Imprimir fatura"
                    >
                      <ReceiptText />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Paginação real (botão) */}
          {hasMore && !loadingFetch && (
            <div className="load-more">
              <button onClick={() => fetchTransactions(true)}>
                Carregar mais
              </button>
            </div>
          )}

          {loadingFetch && data.length > 0 && <p>Carregando mais...</p>}
        </>
      )}

      {/* Modal de fatura */}
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
          countryName={selectedTransaction.countryName}
          statusTransaction={selectedTransaction.statusTransaction}
          dateNow={new Date(selectedTransaction.createdAt).toLocaleString()}
          transactionId={selectedTransaction.id}
          sendCurrencyIso={selectedTransaction.sendCurrencyIso}
          receiveCurrencyIso={selectedTransaction.receiveCurrencyIso}
        />
      )}
    </div>
  );
}
