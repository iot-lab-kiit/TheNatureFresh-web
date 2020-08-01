var admin = require("firebase-admin");
var serviceAccount = require("../credentials.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://thenaturemushroom.firebaseio.com",
  storageBucket: "thenaturemushroom.appspot.com"
});

const db = admin.firestore();

module.exports = {db}