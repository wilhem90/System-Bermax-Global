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

    return confirmationLink
  },
};

module.exports = templateEmail;
