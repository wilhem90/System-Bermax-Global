const { db, Timestamp } = require('../connections/firebase.js');
const { requestDing } = require('../connections/requestDing.js');

const modelTopUp = {
  // Criando TopUp
  createTopUp: async (userData, dataTopup) => {
    try {
      const refUser = db.collection('users').doc(userData.uid);
      const refCashOut = db.collection('transactions').doc(); // transação principal

      let newSolde;
      let lastSolde;
      const createdAt = Timestamp.fromDate(new Date());
      const updatedAt = Timestamp.fromDate(new Date());

      // 🔹 Primeiro: se for operação real, desconta saldo de forma transacional
      if (dataTopup.validateOnly === false) {
        await db.runTransaction(async (t) => {
          const userSnap = await t.get(refUser);
          if (!userSnap.exists) throw new Error('Usuário não encontrado!');

          lastSolde = userSnap.data().soldeAccount || 0;
          if (lastSolde < dataTopup.sendValue) {
            throw new Error('Saldo insuficiente!');
          }

          newSolde = parseFloat(lastSolde) - parseFloat(dataTopup.sendValue);

          // Cria transação pendente
          t.set(refCashOut, {
            accountNumber: dataTopup.accountNumber,
            receiveCountryName: dataTopup.receiveCountryName,
            createdAt,
            createdBy: userData.emailUser,
            deviceid: userData.deviceid,
            distributorRef: dataTopup.distributorRef,
            lastSolde,
            newSolde,
            operatorName: dataTopup.operatorName,
            productName: dataTopup.productName,
            receiveCurrencyIso: dataTopup.receiveCurrencyIso,
            receiveValue: 0,
            sendCurrencyIso: dataTopup.sendCurrencyIso,
            sendValue: dataTopup.sendValue,
            status: 'pending',
            type: 'cash-out',
            updatedAt,
          });

          // Atualiza saldo do usuário
          t.update(refUser, { soldeAccount: newSolde.toFixed(2) });
        });
      }

      // 🔹 Segundo: chama API externa (Ding)
      let responseDing;
      try {
        responseDing = await requestDing('SendTransfer', 'POST', {
          SkuCode: dataTopup.skuCode,
          SendValue: dataTopup.sendValueWithTax,
          SendCurrencyIso: dataTopup.sendCurrencyIso.toUpperCase(),
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

      // 🔻 Caso real e Ding falhou → tentar rollback
      if (!dingOk && dataTopup.validateOnly === false) {
        try {
          await db.runTransaction(async (t) => {
            t.update(refUser, {
              soldeAccount: (
                parseFloat(newSolde) + parseFloat(dataTopup.sendValue)
              ).toFixed(2),
            });

            // marca cashout como failed
            t.update(refCashOut, {
              statusTransaction: 'failed',
              updatedAt: Timestamp.fromDate(new Date()),
              errorMessage: responseDing.error || 'Rejected transaction',
            });
          });

          return {
            success: false,
            message: 'Transação rejeitada. Saldo restaurado.',
            error: responseDing.error || 'Erro externo na API Ding',
          };
        } catch (rollbackError) {
          console.error('Erro ao tentar reverter a transação:', rollbackError);
          return {
            success: false,
            message: 'Falha ao reverter a transação.',
            error: rollbackError.message,
          };
        }
      }

      // 🔹 Caso real e Ding OK → confirmar transação
      if (dataTopup.validateOnly === false) {
        await refCashOut.update({
          status: 'Completed',
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
          status: responseDing?.TransferRecord?.ProcessingState,
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
  updateTopUp: async (idTopup, data) => {
    try {
      console.log(idTopup, data);
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

  // ✅ Backend - modelTopUp.js
  GetTopups: async (data) => {
    try {
      // 🔹 Normaliza datas de início e fim
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      // 🔹 Paginação e controle de limite
      const pageSize = parseInt(data.pageSize || 10, 10);
      const lastCreatedAt = data.lastCreatedAt
        ? new Date(data.lastCreatedAt)
        : null;

      // 🔹 Monta query base
      let queryRef = db
        .collection('transactions')
        .where('createdBy', '==', data.email)
        .where('createdAt', '>=', start)
        .where('createdAt', '<=', end)
        .orderBy('createdAt', 'desc')
        .limit(pageSize);

      if (lastCreatedAt) {
        queryRef = queryRef.startAfter(lastCreatedAt);
      }

      // 🔹 Busca uma vez
      const snapshot = await queryRef.get();

      // 🔹 Evita forEach assíncrono → usa map direto
      const transactions = snapshot.docs.map((doc) => {
        const docData = doc.data();
        return {
          id: doc.id,
          ...docData,
          createdAt: docData.createdAt?.toDate().toISOString(),
        };
      });

      // 🔹 Retorna dados e cursor para próxima página
      return {
        success: true,
        items: transactions,
        lastVisible:
          snapshot.docs.length > 0
            ? snapshot.docs[snapshot.docs.length - 1]
                .data()
                .createdAt.toDate()
                .toISOString()
            : null,
        totalRead: snapshot.size, // 🔹 adiciona info opcional para debug
      };
    } catch (error) {
      console.error('❌ Error fetching paginated transactions:', error);
      return {
        success: false,
        message: 'Server error, please try again.',
      };
    }
  },
};

module.exports = modelTopUp;
