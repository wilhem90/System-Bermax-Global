const { db } = require('../connections/firebase.js');

const userModel = {
	// Get user
	getUser: async (path, value) => {
		let user = [];
		let pathRef = path;
		if (!pathRef) {
			pathRef = value.includes('@') ? 'emailUser' : value.length === 9 ? 'accountNumber' : 'cpfUser';
		}
		const query = await db.collection('users').where(pathRef, '==', value).get();
		if (query.docs[0]) {
			user = query.docs[0].data();
		}
		return {
			success: true,
			data: user,
		};
	},

	// Create user
	createUser: async (dataUser) => {
       const userRef = await db.collection("users").doc().create(dataUser)
       return {
        success: true,
        idUser: userRef.id
       }
    },
};

module.exports = userModel;
