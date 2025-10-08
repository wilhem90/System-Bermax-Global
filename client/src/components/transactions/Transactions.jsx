import { useEffect, useState } from 'react';
import useAuth from '../../Authentication/UseAuth';
import requestApi from '../../services/requestApi';
import './Transactions.css';
import { Printer, Search, SlidersHorizontal } from 'lucide-react';
import Invoice from '../modal/scripts/Invoice.jsx';
import Load from '../loading/Load';

export default function Transactions() {
  const { user } = useAuth();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [inputSearch, setInputSearch] = useState('');

  useEffect(() => {
    async function handleGetData() {
      setLoading(true);
      try {
        const response = await requestApi('topup/get-topups', 'GET', {
          ...user,
          startDate: '20-09-2025',
          endDate: '05-10-2025',
        });

        if (response?.success && Array.isArray(response.items)) {
          setData(response.items);
        } else {
          console.log(response?.message);
          setError(response?.message || 'Erro ao carregar transações.');
        }
      } catch (err) {
        setError('Erro inesperado: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    handleGetData();
  }, [user]);

  return (
    <div className="box-transactions">
      {/* Barra de busca e filtros */}
      <div className="box-search">
        <div className="box-input-svg">
          <input
            type="text"
            name="search-value"
            id="input-search"
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

      {/* Conteúdo: carregando, erro ou tabela */}
      {loading ? (
        <Load message={'Carregando...'} />
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
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
            {data
              .sort()
              .filter((item) => {
                const search = inputSearch.toLowerCase();
                return (
                  item.accountNumber?.toLowerCase().includes(search) ||
                  item.productName?.toLowerCase().includes(search) ||
                  item.createdBy?.toLowerCase().includes(search) ||
                  item.statusTransaction?.toLowerCase().includes(search)
                );
              })
              .map((item) => (
                <tr key={item.id}>
                  <td>{new Date(item.createdAt).toLocaleString()}</td>
                  <td>{item.accountNumber}</td>
                  <td>{item.productName}</td>
                  <td>
                    {item.sendCurrencyIso}{' '}
                    {parseFloat(item.sendValue).toFixed(2)}
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

      {/* Componente de fatura (Invoice) */}
      {showInvoice && selectedTransaction && (
        <Invoice
          onClose={() => {
            setShowInvoice(false);
            setSelectedTransaction(null);
          }}
          onReset={() => ({})}
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
