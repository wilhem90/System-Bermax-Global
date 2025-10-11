import {  useEffect, useState } from 'react';
import useAuth from '../../Authentication/UseAuth';
import requestApi from '../../services/requestApi';
import './Transactions.css';
import { Printer, Search, SlidersHorizontal } from 'lucide-react';
import Invoice from '../modal/scripts/Invoice.jsx';
import Load from '../loading/Load';

export default function Transactions() {
  const { user, Login, handleJwtRefresh } = useAuth();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [inputSearch, setInputSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    async function fetchTransactions() {
      // Validar datas
      if (startDate && endDate && startDate > endDate) {
        setError('A data inicial não pode ser maior que a data final.');
        setLoading(false);
        return;
      }

      // Caso datas estejam vazias, definir padrão de hoje
      const today = new Date().toISOString().split('T')[0];
      const start = startDate || today;
      const end = endDate || today;

      setStartDate(start);
      setEndDate(end);
      setLoading(true);
      setError(null);

      try {
        const response = await requestApi(
          `topup/get-topups?startDate=${start}&endDate=${end}&emailUser=${user.emailUser}`,
          'GET',
          { ...user }
        );

        if (!response.success && response.message.includes('jwt expired')) {
          await handleJwtRefresh(response.message, user);
          return;
        }

        if (response?.success && Array.isArray(response.items)) {
          setData(response.items);
        } else {
          setError(response?.message || 'Erro ao carregar transações.');
        }
      } catch (err) {
        setError('Erro inesperado: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

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
            type="text"
            placeholder="Search"
            value={inputSearch}
            onChange={(e) => setInputSearch(e.target.value)}
          />
          <Search className="icon-search" />
        </div>
        <div className="filter">
          <SlidersHorizontal />
          <span>Filter</span>
        </div>
      </div>

      {/* Conteúdo principal */}
      {loading ? (
        <Load message={'Carregando...'} />
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : filteredData.length === 0 ? (
        <p>Nenhuma transação encontrada.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Created at</th>
              <th>Account number</th>
              <th>Product name</th>
              <th>Amount sent</th>
              <th>Amount received</th>
              <th>Status</th>
              <th>Created by</th>
              <th>Printer</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((item) => (
              <tr key={item.id}>
                <td>{new Date(item.createdAt).toLocaleString()}</td>
                <td>{item.accountNumber}</td>
                <td>{item.productName}</td>
                <td>
                  {item.sendCurrencyIso} {parseFloat(item.sendValue).toFixed(2)}
                </td>
                <td>
                  {item.receiveCurrencyIso}{' '}
                  {parseFloat(item.receiveValue).toFixed(2)}
                </td>
                <td>{item.statusTransaction}</td>
                <td>{item.createdBy}</td>
                <td>
                  <button
                    onClick={() => {
                      setSelectedTransaction(item);
                      setShowInvoice(true);
                    }}
                    title="Imprimir fatura"
                  >
                    <Printer />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal de fatura */}
      {showInvoice && selectedTransaction && (
        <Invoice
          onClose={() => {
            setShowInvoice(false);
            setSelectedTransaction(null);
          }}
          onReset={() => {}}
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
