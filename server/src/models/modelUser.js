const { db, Timestamp } = require('../connections/firebase.js');

const userModel = {
  // Get user
  getUser: async (path, value) => {
    let user = {};
    let pathRef = path;
    if (!pathRef) {
      pathRef = value.includes('@')
        ? 'emailUser'
        : value.length === 9
        ? 'accountNumber'
        : 'cpfUser';
    }
    const query = await db
      .collection('users')
      .where(pathRef, '==', value)
      .get();
    if (query.docs[0]) {
      user = query.docs[0].data();
    }
    return {
      success: true,
      data: { uid: query?.docs?.[0]?.id, ...user },
    };
  },

  // Create user
  createUser: async (dataUser) => {
    const userRef = await db.collection('users').doc().create(dataUser);
    return {
      success: true,
      uid: userRef.id,
    };
  },

  // Let's update account of user
  updateUser: async (uid, dataUpdate) => {
    await db
      .collection('users')
      .doc(uid)
      .update({ ...dataUpdate, updatedAt: Timestamp.fromDate(new Date()) });

    return {
      success: true,
      message: 'Data updated!',
    };
  },

  getCongigApp: async (transfermoney) => {
    const query = await db.collection('configApp').doc(transfermoney).get();
    const data = query.data();
    console.log(data);
    return data;
  },

  updateAppConfig: async (transfermoney, data) => {
    await db.collection('configApp').doc(transfermoney).update(data);
    return {
      success: true,
    };
  },
};

module.exports = userModel;
