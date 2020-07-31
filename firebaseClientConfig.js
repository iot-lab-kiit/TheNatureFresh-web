var firebase = require('firebase/app')
require('firebase/auth')
require('firebase/storage')

const firebaseConfig = {
    apiKey: "AIzaSyBC4aReuYFlrobEWn6P9YnVjUb8UBPAvDA",
    authDomain: "thenaturemushroom.firebaseapp.com",
    databaseURL: "https://thenaturemushroom.firebaseio.com",
    projectId: "thenaturemushroom",
    storageBucket: "thenaturemushroom.appspot.com",
    messagingSenderId: "90847189009",
    appId: "1:90847189009:web:3adbb7162d097af4a2f9b0",
    measurementId: "G-YBSZKTSX1Z"
}

firebase.initializeApp(firebaseConfig)
module.exports = {
    auth: firebase.auth(),
    storage: firebase.storage().ref()
}

