import { useRef } from 'react';
import html2pdf from 'html2pdf.js';
import '../styles/Invoice.css';

export default function Invoice({
  onClose,
  amount,
  amountReceived,
  operatorName,
  accountNumber,
  receiveCountryName,
  statusTransaction,
  dateNow,
  transactionId,
  sendCurrencyIso,
  receiveCurrencyIso,
  typeTransaction,
  fullNameBeneficiary,
}) {
  const invoiceRef = useRef();

  const handleDownloadPDF = () => {
    const opt = {
      margin: 0.3,
      filename: `comprovante-${transactionId || Date.now()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    };

    html2pdf().set(opt).from(invoiceRef.current).save();
  };

  return (
    <div className="invoice-overlay">
      <div className="invoice-modal">
        <div className="invoice-actions">
          <button className="btn-download" onClick={handleDownloadPDF}>
            📄 Baixar PDF
          </button>
          <button
            className="btn-close"
            onClick={() => {
              onClose();
            }}
          >
            ✖ Fechar
          </button>
        </div>

        <div ref={invoiceRef} className="invoice-container">
          <div className="invoice-header">
            <h1>BERMAX GLOBAL LTDA</h1>
            <p>Comprovante de Transação ✅</p>
          </div>

          <p className="invoice-info">
            Segue abaixo o comprovante da sua recarga realizada com sucesso:
          </p>

          <table className="invoice-table">
            <tbody>
              <tr className="alt">
                <td className="invoice-td">
                  <strong>Tipo transação</strong>
                </td>
                <td className="invoice-td success">
                  <strong>{typeTransaction}</strong>
                </td>
              </tr>
              <tr>
                <td className="invoice-td">
                  <strong>País</strong>
                </td>
                <td className="invoice-td">{receiveCountryName}</td>
              </tr>
              <tr>
                <td className="invoice-td">
                  <strong>Operadora</strong>
                </td>
                <td className="invoice-td">{operatorName}</td>
              </tr>
              <tr className="alt">
                <td className="invoice-td">
                  <strong>Número</strong>
                </td>
                <td className="invoice-td black">
                  <strong>{accountNumber}</strong>
                </td>
              </tr>
              {fullNameBeneficiary && (
                <tr className="alt">
                  <td className="invoice-td">
                    <strong>Beneficiario</strong>
                  </td>
                  <td className="invoice-td black">
                    <strong style={{textTransform: "capitalize"}}>{fullNameBeneficiary}</strong>
                  </td>
                </tr>
              )}
              <tr>
                <td className="invoice-td">
                  <strong>Status</strong>
                </td>
                <td
                  className={`invoice-td ${
                    ['complete', 'completed', 'Complete', 'Completed'].includes(
                      statusTransaction
                    )
                      ? 'success'
                      : 'error'
                  }`}
                >
                  {statusTransaction}
                </td>
              </tr>
              <tr>
                <td className="invoice-td">
                  <strong>Valor Enviada</strong>
                </td>
                <td className="invoice-td">
                  <strong>
                    {parseFloat(amount).toLocaleString('pt-br', {
                      style: 'currency',
                      currency: sendCurrencyIso,
                    })}
                  </strong>
                </td>
              </tr>
              <tr>
                <td className="invoice-td">
                  <strong>Valor Recebido</strong>
                </td>
                <td className="invoice-td">
                  <strong>
                    {parseFloat(amountReceived).toLocaleString('pt-br', {
                      style: 'currency',
                      currency: receiveCurrencyIso,
                    })}
                  </strong>
                </td>
              </tr>
              <tr>
                <td className="invoice-td">
                  <strong>Data e Hora</strong>
                </td>
                <td className="invoice-td">{dateNow}</td>
              </tr>
              {transactionId && (
                <tr>
                  <td className="invoice-td">
                    <strong>ID da Transação</strong>
                  </td>
                  <td className="invoice-td">{transactionId}</td>
                </tr>
              )}
            </tbody>
          </table>
          <p className="invoice-copy">
            © {new Date().getFullYear()} BERMAX GLOBAL LTDA
          </p>
        </div>
      </div>
    </div>
  );
}
