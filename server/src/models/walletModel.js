const { db } = require('../connections/firebase');
const userMiddleware = require('../middlewares/authMiddleware');
const userModel = require('./modelUser');

const walletModel = {
  addToMyAccount: async (userData, amount, methodDeposit) => {
    const userRef = db.collection('users').doc(userData.uid);
    const extractRef = db.collection('transactions').doc();

    // 🔥 Cria um registro pendente (sem mexer no saldo)
    await db.runTransaction(async (t) => {
      const userSnap = await t.get(userRef);
      if (!userSnap.exists) throw new Error('Usuário não encontrado.');

      t.set(extractRef, {
        cpfUser: userData.cpfUser,
        accountNumber: userData.accountNumber,
        createdAt: new Date(),
        createdBy: userData.emailUser,
        phoneUser: userData.phoneNumber,
        fullName: `${userData.firstNameUser} ${userData.lastNameUser}`,
        method: methodDeposit,
        productName: 'deposit',
        sendValue: amount,
        status: 'pending',
        type: 'cash-in',
        updatedAt: new Date(),
      });
    });

    return {
      success: true,
      message: 'Depósito registrado com sucesso, aguardando processamento.',
      transactionId: extractRef.id,
    };
  },
  

  withdrawFromMyAccount: async (
    userData,
    amount,
    method,
    destination,
    pinTransaction
  ) => {
    // lógica de saque
    const userRef = db.collection('users').doc(userData.uid);
    const extractRef = userRef.collection('extracts').doc();

    const isMatch = userMiddleware.isPinTransactionMatch(
      pinTransaction,
      userData
    );

    if (!isMatch) {
      return {
        success: false,
        message: 'Pin transação não válido.',
      };
    }

    const result = await db.runTransaction(async (t) => {
      const userSnap = await t.get(userRef);
      if (!userSnap.exists) throw new Error('Usuário não encontrado.');

      const lastSolde = userSnap.data().soldeAccount || 0;
      if (lastSolde < amount) throw new Error('Saldo insuficiente.');

      const newSolde = lastSolde - amount;
      t.update(userRef, { soldeAccount: newSolde });

      t.set(extractRef, {
        typeTransaction: 'withdraw',
        createdBy: userData.emailUser,
        lastSolde,
        amount,
        newSolde,
        method,
        destination,
        status: 'pending', // até o processamento externo confirmar
        createdAt: new Date(),
      });

      return { lastSolde, newSolde, transactionId: extractRef.id };
    });
  },

  transferToAnotherAccount: async () => {
    // lógica de transferência
  },
};

module.exports = walletModel;
