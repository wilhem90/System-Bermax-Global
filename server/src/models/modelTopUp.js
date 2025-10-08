const { db, Timestamp } = require('../connections/firebase.js');
const { requestDing } = require('../connections/requestDing.js');

const modelTopUp = {
  // Criando TopUp
  createTopUp: async (dataTopup, userData) => {
    try {
      const refUser = db.collection('users').doc(userData.idUser);
      const refCashOut = db.collection('transactions').doc(); // transação principal
      const refRefund = db.collection('transactions').doc(); // transação de reembolso (se necessário)

      let newSolde;
      let lastSolde;

      // 🔹 Primeiro: se for operação real, desconta saldo de forma transacional
      if (dataTopup.validateOnly === false) {
        await db.runTransaction(async (t) => {
          const userSnap = await t.get(refUser);
          if (!userSnap.exists) throw new Error('Usuário não encontrado!');

          lastSolde = userSnap.data().soldeAccount || 0;
          if (lastSolde < dataTopup.sendValue) {
            throw new Error('Saldo insuficiente!');
          }

          newSolde = lastSolde - dataTopup.sendValue;

          // Cria transação pendente
          t.set(refCashOut, {
            ...dataTopup,
            productName: 'topup',
            statusTransaction: 'pending',
            createdBy: userData.emailUser,
            typeTransaction: 'cash-out',
            lastSolde,
            newSolde,
          });

          // Atualiza saldo do usuário
          t.update(refUser, { soldeAccount: newSolde });
        });
      }

      // 🔹 Segundo: chama API externa (Ding)
      let responseDing;
      try {
        responseDing = await requestDing('SendTransfer', 'POST', {
          SkuCode: dataTopup.skuCode,
          SendValue: dataTopup.sendValueWithTax,
          SendCurrencyIso: dataTopup.sendCurrencyIso,
          AccountNumber: dataTopup.accountNumber,
          DistributorRef: dataTopup.distributorRef,
          ValidateOnly: dataTopup.validateOnly,
        });
      } catch (err) {
        responseDing = { success: false, error: err.message };
      }

      // 🔹 Verificação robusta do resultado
      const dingOk =
        responseDing.success &&
        responseDing?.TransferRecord?.ProcessingState === 'Complete';

      // Caso real e Ding falhou → rollback
      if (!dingOk && dataTopup.validateOnly === false) {
        await db.runTransaction(async (t) => {
          t.update(refUser, { soldeAccount: newSolde + dataTopup.sendValue });

          // marca cashout como failed
          t.update(refCashOut, {
            statusTransaction: 'failed',
            updatedAt: Timestamp.fromDate(new Date()),
            errorMessage: responseDing.error || 'Ding rejected transaction',
          });

          // opcional: cria transação de reembolso
          t.set(refRefund, {
            productName: 'refund-topup',
            statusTransaction: 'completed',
            typeTransaction: 'refund',
            sendValue: dataTopup.sendValue,
            sendCurrencyIso: dataTopup.sendCurrencyIso,
            lastSolde: newSolde,
            newSolde: newSolde + dataTopup.sendValue,
            createdBy: userData.emailUser,
            createdAt: Timestamp.fromDate(new Date()),
            updatedAt: Timestamp.fromDate(new Date()),
          });
        });

        return {
          success: false,
          message: 'Transação rejeitada pela Ding. Saldo restaurado.',
        };
      }

      // Caso real e Ding OK → confirmar transação
      if (dataTopup.validateOnly === false) {
        await refCashOut.update({
          statusTransaction: 'completed',
          transferRef:
            responseDing?.TransferRecord?.TransferId?.TransferRef || null,
          receiveValue:
            responseDing?.TransferRecord?.Price?.ReceiveValue || null,
          updatedAt: Timestamp.fromDate(new Date()),
        });
      }

      // 🔹 Retorno final
      return {
        success: true,
        message:
          dataTopup.validateOnly === false
            ? 'Transaction completed successfully!'
            : 'Estimated value!',
        data: {
          transferId: dataTopup.validateOnly === false ? refCashOut.id : null,
          idTopup:
            responseDing?.TransferRecord?.TransferId?.TransferId ||
            dataTopup.distributorRef,
          amountReceived: responseDing?.TransferRecord?.Price?.ReceiveValue,
          receiveCurrencyIso:
            responseDing?.TransferRecord?.Price?.ReceiveCurrencyIso,
          statusTransaction: responseDing?.TransferRecord?.ProcessingState,
          lastSolde: dataTopup.validateOnly === false ? lastSolde : null,
          newSolde: dataTopup.validateOnly === false ? newSolde : null,
        },
      };
    } catch (error) {
      console.error('Erro em createTopUp:', error);
      return {
        success: false,
        message: 'Erro interno ao processar a transação.',
        error: error.message,
      };
    }
  },

  // Atualizar TopUp
  updateTopUp: async (idUser, idTopup, data) => {
    try {
      if (!idTopup) throw new Error('ID do topup é obrigatório.');
      await db
        .collection('transactions')
        .doc(idTopup)
        .update({
          ...data,
          updatedAt: Timestamp.fromDate(new Date()),
        });

      return {
        success: true,
        message: 'Atualizada com sucesso!',
      };
    } catch (error) {
      console.error('Erro em modelTopUp.updateTopUp:', error);
      return {
        success: false,
        message: error.message,
      };
    }
  },

  // Buscamos todas as transaçoes registradas
  GetTopups: async (data) => {
    console.log(data);

    try {
      let start = new Date(data.startDate);
      let end = new Date(data.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 59);

      let querySnapshot = await db
        .collection('transactions')
        .where('createdAt', '>=', start)
        .where('createdAt', '<=', end)
        .where('createdBy', '==', data.email)
        .orderBy('createdAt', 'desc') 
        .get();

      const transactions = [];
      querySnapshot.forEach((doc) => {
        const docData = doc.data();
        transactions.push({
          id: doc.id,
          ...docData,
          createdAt: docData.createdAt?.toDate(),
        });
      });

      return {
        success: true,
        items: transactions,
      };
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return {
        success: false,
        message: 'Server error, please try again.',
      };
    }
  },
};

module.exports = modelTopUp;
