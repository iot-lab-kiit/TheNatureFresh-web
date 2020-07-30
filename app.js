var admin = require("firebase-admin");
var express = require("express");
var bodyParser = require("body-parser");
var auth = require("./firebaseClientConfig.js");
var session = require("express-session");
var cookieParser = require("cookie-parser");
var serviceAccount = require("./credentials.json");
var axios = require('axios');

var app = express();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://thenaturemushroom.firebaseio.com",
  storageBucket: "thenaturemushroom.appspot.com"
});

const db = admin.firestore();
var bucket = admin.storage().bucket();


app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(
  session({
    key: "creds",
    secret: "hahalollmao",
    saveUninitialized: false,
    rolling: true,
    resave: true,
    cookie: {
      maxAge: 30000,
    },
  })
);

const checkAdmin = (req, res, next) => {
  if (req.session.role == "admin" && req.cookies.creds && req.session.user)
    next();
  else res.send("not authorised");
};

const checkUser = (req, res, next) => {
  if (req.session.role == "user" && req.cookies.creds && req.session.user)
    next();
  else res.send("not authorised");
};

const checkLogin = (req, res, next) => {
  if (req.session.user && req.cookies.creds) next();
  else res.send("not logged in");
};

app.use((req, res, next) => {
  if (req.cookies.creds && !req.session.user) {
    res.clearCookie("creds");
  }
  next();
});

app.post("/create", (req, res) => {
  console.log(req.body);
  const {
    email,
    phoneNumber,
    password,
    urole,
    uaddress,
    firstName,
    lastName,
    photoUrl,
  } = req.body;

  admin
    .auth()
    .createUser({
      email,
      phoneNumber,
      password,
      displayName: `${firstName} ${lastName}`,
      photoURL: photoUrl,
    })
    .then((user) => {
      console.log(user);
      db.collection("users").add({
        uid: user.uid,
        role: urole,
        address: uaddress,
      });
      res.json(user);
    })
    .catch((err) => {
      console.error(err);
      res.json(err);
    });
});

app.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  var frole, fadd;
  try {
    var user = await auth.signInWithEmailAndPassword(email, password);
    var snap = await db
      .collection("users")
      .where("uid", "==", user.user.uid)
      .get();
    snap.forEach((doc) => {
      frole = doc.data().role;
      fadd = doc.data().address;
    });
    req.session.user = user.user;
    req.session.role = frole;
    req.session.address = fadd;
    res.redirect("/protected");
  } catch (err) {
    console.error("Signin Error!");
    res.json(err);
  }
});


app.get("/users", (req, res) => {
  res.render('users');
});

app.get("/admin", async (req, res) => {
  var response = await axios.get('http://localhost:3001/api/products')
  res.render('admin',{products:response.data});
});

app.get("/create-item", (req, res) => {
  res.render('create_item');
});

app.get("/orders", async (req, res) => {
  var response = await axios.get('http://localhost:3001/api/orders/')
  console.log(response.data);
  res.render('orders',{products:response.data});
});


app.post("/create-item", (req, res) => {
  res.send(req.body);
});

app.get("/profile", (req, res) => {
  res.render('profile');
});

app.get("/edit-user", (req, res) => {
  res.render('edit_user');
});

app.get("/edit-item", (req, res) => {
  res.render('edit_item');
});

app.get("/edit-order", (req, res) => {
  res.render('edit_order');
});

app.get("/create-order", (req, res) => {
  res.render('create_order');
});

app.get("/create-item", (req, res) => {
  res.render('create_item');
});

app.get("/", (req, res) => {
  if (req.session.user) res.send(req.session.user);
  else res.send("nopes");
});

app.get("/protected", checkAdmin, (req, res) => {
  res.status(200).json({ message: "Protected Resource!" });
});

app.get("/loggedin", checkLogin, (req, res) => {
  res.status(200).json({ message: "Logged In" });
});

app.listen(3000, () => {
  console.log("App Listening at port 3000");
});
