const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_APP,
    pass: process.env.PASSWORD_APP,
  },
});

// Helper function to format currency safely
const formatCurrency = (value) => {
  if (value == null || isNaN(value)) {
    return "R$ 0,00";
  }
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
};

// Helper function to format date safely
const formatDate = (date) => {
  if (!date) return new Date().toLocaleString("pt-BR");
  return new Date(date).toLocaleString("pt-BR");
};

const templateEmail = {
  validateEmailUser: async (data) => {
    const { emailUser, firstNameUser, confirmToken, deviceId } = data;

    const confirmationLink = `${process.env.APP_URL}/users/verify-email?token=${confirmToken}&deviceId=${deviceId}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <style>
          .button {
            background-color: #ffffffff;
            color: #051affff;
            border: 1px solid #051affff;
            text-decoration: none;
            padding: 12px 20px;
            border-radius: 5px;
            display: inline-block;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2>Olá, ${firstNameUser}!</h2>
          <p>${data.messageAction}, clique no botão abaixo:</p>
          <p style="text-align: center;">
            <a class="button" href="${confirmationLink}">${data.textBtn}</a>
          </p>
          <p>Se você não ${data.ignoreMail}, ignore este e-mail. A validação é: <strong>15 minutos</strong></p>
          <br>
          <p>Atenciosamente,<br>Equipe Bermax Global Ltda</p>
        </div>
      </body>
      </html>
    `;

    try {
      const info = await transporter.sendMail({
        from: `"Bermax Global Ltda" <${process.env.EMAIL_APP}>`,
        to: emailUser,
        subject: `${data.subject} - Bermax Global`,
        html: htmlContent,
      });
    } catch (error) {
      console.error('Erro ao enviar e-mail de confirmação:', error);
    }

    return confirmationLink;
  },

  // Invoice recarga
  invoiceTopUp: async (
    emailUser,
    amount,
    amountReceived,
    operatorName,
    accountNumber,
    countryName,
    statusTransaction,
    date,
    transactionId,
    sendCurrencyIso,
    receiveCurrencyIso
  ) => {
    const htmlContent = (
      `
  <div style="font-family: Arial, sans-serif; max-width: 650px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #fafafa;">
    
    <!-- Cabeçalho -->
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="margin: 0; color: #2c3e50;">BERMAX GLOBAL LTDA</h1>
      <p style="margin: 5px 0; color: #7f8c8d;">Comprovante de Transação ✅</p>
    </div>

    <p style="font-size: 15px;">Segue abaixo o comprovante da sua recarga realizada com sucesso:</p>

    <!-- Detalhes da Transação -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px;">
      <tr style="background-color: #f0f0f0;">
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>Tipo transação</strong></td>
        <td style="padding: 12px; border: 1px solid #ddd; color: #27ae60; font-weight: bold;">Recarga</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>País</strong></td>
        <td style="padding: 12px; border: 1px solid #ddd;">${countryName}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>Operadora</strong></td>
        <td style="padding: 12px; border: 1px solid #ddd;">${operatorName}</td>
      </tr>
      <tr style="background-color: #f0f0f0;">
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>Número</strong></td>
        <td style="padding: 12px; border: 1px solid #ddd; color: #000000ff; font-weight: bold;">${accountNumber}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>Status</strong></td>
        <td style="padding: 12px; border: 1px solid #ddd; color: ${
          statusTransaction === 'Complete' ? '#27ae60' : '#e74c3c'
        }; font-weight: bold; text-transform: capitalize;">${statusTransaction}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>Valor da Recarga</strong></td>
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>${sendCurrencyIso} ${formatCurrency(
        amount
      )}</strong></td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>Valor Recebido</strong></td>
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>${receiveCurrencyIso} ${amountReceived}</strong></td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>Data e Hora</strong></td>
        <td style="padding: 12px; border: 1px solid #ddd;">${formatDate(
          date
        )}</td>
      </tr>
      ${
        transactionId
          ? `
      <tr>
        <td style="padding: 12px; border: 1px solid #ddd;"><strong>ID da Transação</strong></td>
        <td style="padding: 12px; border: 1px solid #ddd;">${transactionId}</td>
      </tr>`
          : ''
      }
    </table>

    <!-- Rodapé -->
    <p style="margin-top: 30px; font-size: 14px; color: #7f8c8d; text-align: center;">
      Este é um comprovante eletrônico. Não é necessário respondê-lo.
    </p>
    <p style="text-align: center; font-size: 12px; color: #999;">
      © ${new Date().getFullYear()} BERMAX GLOBAL LTDA
    </p>
  </div>
  `
    );

     try {
      const info = await transporter.sendMail({
        from: `"Bermax Global Ltda" <${process.env.EMAIL_APP}>`,
        to: emailUser,
        subject:  `📄 Comprovante de Recarga`,
        html: htmlContent,
      });
    } catch (error) {
      console.error('Erro ao enviar e-mail de confirmação:', error);
    }

  },
};

module.exports = templateEmail;
