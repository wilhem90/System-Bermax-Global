const { db } = require('../connections/firebase.js');
const walletModel = require('../models/walletModel.js');
const templateEmail = require('../senderEmail/sendEmail.js');

const walletController = {
  // ----------------------------------------------------------------
  //    Depositar valor na conta do próprio usuário
  // ----------------------------------------------------------------
  depositToMyAccount: async (req, res) => {
    try {
      const { amount, methodDeposit } = req.body;
      const userData = req.user;

      if (!methodDeposit || !['PIX'].includes(methodDeposit)) {
        return res.status(400).json({
          success: false,
          message: 'Deve enviar um método válido. Ex: PIX',
        });
      }
      if (!amount || amount < 50 || amount > 2000) {
        return res.status(400).json({
          success: false,
          message: 'Value must be: R$ 50,00 a 2000,00',
        });
      }

      const refDeposit = await walletModel.addToMyAccount(
        userData,
        amount,
        methodDeposit
      );

      templateEmail.invoiceDeposit(
        userData.emailUser,
        userData.firstNameUser,
        amount,
        'Deposito foi criado.',
        userData.soldeAccount,
        userData.soldeAccount,
        new Date(),
        refDeposit.transactionId
      );
      return res.status(201).json({
        success: true,
        message: 'Depósito criado com sucesso! Aguarde confirmação.',
        depositId: refDeposit.transactionId,
      });
    } catch (error) {
      console.error('depositToMyAccount:', error);
      return res
        .status(500)
        .json({ success: false, message: error.message || 'Erro interno.' });
    }
  },

  // ----------------------------------------------------------------
  //    Saque de saldo do próprio usuário
  // ----------------------------------------------------------------
  withdrawFunds: async (req, res) => {
    try {
      if (!req.user?.lastLogins[req.user?.deviceid]?.active) {
        return res.status(401).json({
          success: false,
          message: 'Não está autorizado!',
        });
      }
      const { amount, method, destination, pinTransaction } = req.body;
      if (!amount || amount <= 0)
        return res
          .status(400)
          .json({ success: false, message: 'Valor inválido.' });
      if (!['PIX', 'TED'].includes(method))
        return res
          .status(400)
          .json({ success: false, message: 'Método inválido.' });
      if (!destination)
        return res
          .status(400)
          .json({ success: false, message: 'Destino obrigatório.' });

      const result = await walletModel.withdrawFromMyAccount(
        req.user,
        amount,
        method,
        destination,
        pinTransaction
      );

      return res.status(200).json({
        success: true,
        message: 'Saque registrado com sucesso, aguardando processamento.',
        transactionId: result.transactionId,
        amount,
        method,
        destination,
        currencyIso: 'BRL',
      });
    } catch (error) {
      console.error('Erro withdrawFunds:', error);
      return res
        .status(500)
        .json({ success: false, message: error.message || 'Erro interno.' });
    }
  },

  // ----------------------------------------------------------------
  //    Transferência de saldo entre usuários
  // ----------------------------------------------------------------
  transferFunds: async (req, res) => {
    try {
      if (!req.user?.lastLogins[req.user?.deviceid]?.active) {
        return res.status(401).json({
          success: false,
          message: 'Não está autorizado!',
        });
      }
      const { accountNumber, amount, pinTransaction } = req.body;
      if (!amount || amount <= 0)
        return res
          .status(400)
          .json({ success: false, message: 'Valor inválido.' });
      if (req.user.accountNumber === accountNumber) {
        return res.status(400).json({
          success: false,
          message: 'Não pode transferir para si mesmo.',
        });
      }

      const senderRef = db.collection('users').doc(req.user.idUser);
      const receiverUser = await modelUser.getUser(
        'accountNumber',
        accountNumber
      );
      if (!receiverUser.success)
        return res
          .status(404)
          .json({ success: false, message: 'Destinatário não encontrado.' });

      const receiverRef = db.collection('users').doc(receiverUser.idUser);

      const senderLogged = await modelUser.getUser(
        'accountNumber',
        req.user.accountNumber
      );
      if (!bcrypt.compareSync(pinTransaction, senderLogged.pinTransaction)) {
        return res
          .status(401)
          .json({ success: false, message: 'Pin transação não válido.' });
      }

      const result = await db.runTransaction(async (t) => {
        const senderSnap = await t.get(senderRef);
        const receiverSnap = await t.get(receiverRef);

        if (!senderSnap.exists || !receiverSnap.exists)
          throw new Error('Usuários inválidos.');
        const senderSolde = senderSnap.data().soldeAccount || 0;
        const receiverSolde = receiverSnap.data().soldeAccount || 0;

        if (senderSolde < amount) throw new Error('Saldo insuficiente.');

        const newSenderSolde = senderSolde - amount;
        const newReceiverSolde = receiverSolde + amount;

        t.update(senderRef, { soldeAccount: newSenderSolde });
        t.update(receiverRef, { soldeAccount: newReceiverSolde });

        const senderExtractRef = senderRef.collection('extracts').doc();
        const receiverExtractRef = receiverRef.collection('extracts').doc();

        t.set(senderExtractRef, {
          typeTransaction: 'cash_out',
          fromUser: req.user.emailUser,
          toUser: receiverUser.emailUser,
          amount,
          lastSolde: senderSolde,
          newSolde: newSenderSolde,
          status: 'completed',
          createdAt: new Date(),
        });

        t.set(receiverExtractRef, {
          typeTransaction: 'cash_in',
          fromUser: req.user.emailUser,
          toUser: receiverUser.emailUser,
          amount,
          lastSolde: receiverSolde,
          newSolde: newReceiverSolde,
          status: 'completed',
          createdAt: new Date(),
        });

        return { newSenderSolde, newReceiverSolde };
      });

      return res.status(200).json({
        success: true,
        message: 'Transferência realizada com sucesso.',
        ...result,
        currencyIso: 'BRL',
      });
    } catch (error) {
      console.error('Erro transferFunds:', error);
      return res
        .status(500)
        .json({ success: false, message: error.message || 'Erro interno.' });
    }
  },
};

module.exports = walletController;
