const { db, Timestamp } = require('../connections/firebase');

const transferModel = {
  createTransfer: async (userData, dataCashMoney) => {
    const refUser = db.collection('users').doc(userData.uid);
    const createdAt = Timestamp.fromDate(new Date());
    const updatedAt = Timestamp.fromDate(new Date());
    let refTransaction;

    try {
      await db.runTransaction(async (t) => {
        const userSnap = await t.get(refUser);
        if (!userSnap.exists) {
          throw new Error('Usuário não encontrado!');
        }

        const lastSolde = userSnap.data().soldeAccount || 0;
        if (parseFloat(lastSolde) < parseFloat(dataCashMoney.sendValue)) {
          throw new Error('Saldo insuficiente!');
        }

        const newSolde =
          parseFloat(lastSolde) -
          parseFloat(dataCashMoney.sendValue) +
          parseFloat(dataCashMoney.commission);

        // Atualiza o saldo do usuário
        t.update(refUser, { soldeAccount: parseFloat(newSolde).toFixed(2) });

        // Cria a transação
        refTransaction = db.collection('transactions').doc();
        t.set(refTransaction, {
          ...dataCashMoney,
          lastSolde: parseFloat(lastSolde).toFixed(2),
          newSolde: parseFloat(newSolde).toFixed(2),
          createdAt,
          updatedAt,
        });
      });

      return {
        success: true,
        data: {
          message: 'Transferência criada com sucesso',
          transferId: refTransaction.id,
          createdAt: new Date(createdAt.seconds * 1000),
          receiveCountryName: dataCashMoney.receiveCountryName,
          receiveCurrencyIso: dataCashMoney.receiveCurrencyIso,
          receiveValue: dataCashMoney.receiveValue,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erro ao criar transferência',
      };
    }
  },

  getBeneficiary: async (accountNumber) => {
    const productName = 'cash-money';
    const refDoc = await db
      .collection('transactions')
      .where('accountNumber', '==', accountNumber)
      .where('productName', '==', productName)
      .get();

    const benefi = refDoc.docs[0];
    if (!benefi) {
      return {
        success: true,
        data: [],
      };
    }
    return {
      success: true,
      data: benefi?.data() || [],
    };
  },
};
module.exports = transferModel;
