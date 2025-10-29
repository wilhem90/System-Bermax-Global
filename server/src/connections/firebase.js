const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');

const serviceAccount = require('./credencials.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
module.exports = { db, Timestamp, FieldValue, Filter }

