const admin = require('firebase-admin');
const { readFileSync } = require('fs');

// Carrega credenciais
const serviceAccount = JSON.parse(readFileSync('./firebase-key.json', 'utf8'));

// Inicializa Firebase
const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'bermax-global-ltda-6c1f4.firebasestorage.app',
});

// Firestore
const db = admin.firestore();

// Storage
const bucket = admin.storage().bucket();

// Exporta tudo corretamente
module.exports = {
  firebaseApp: app,
  firestoreDB: db,
  storageBucket: bucket,
};
