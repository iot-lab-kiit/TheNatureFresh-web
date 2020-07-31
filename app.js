var admin = require("firebase-admin");
var express = require("express");
var bodyParser = require("body-parser");
var auth = require("./firebaseClientConfig.js");
var session = require("express-session");
var cookieParser = require("cookie-parser");
var serviceAccount = require("./credentials.json");
var axios = require('axios');
var app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

////////////////////
//FIREBASE INIT
////////////////////

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://thenaturemushroom.firebaseio.com",
  storageBucket: "thenaturemushroom.appspot.com"
});

const db = admin.firestore();
var bucket = admin.storage().bucket();

//////////////////
//COOKIE SET
//////////////////


app.use(
  session({
    key: "creds",
    secret: "hahalollmao",
    saveUninitialized: false,
    rolling: true,
    resave: true,
    cookie: {
      expires: 300000,
    },
  })
);

app.use((req, res, next) => {
  if (req.cookies.creds && !req.session.user) {
    res.clearCookie("creds");
  }
  next();
});


/////////////////
//MIDDLEWARE START
////////////////

const checkAdmin = (req, res, next) => {
  if (req.session.role == "admin" && req.cookies.creds && req.session.user)
    next();
  else res.redirect('/reroute')
};

const checkUser = (req, res, next) => {
  if (req.session.role == "user" && req.cookies.creds && req.session.user)
    next();
    else res.redirect('/reroute')
};

const checkLogin = (req, res, next) => {
  if (req.session.user && req.cookies.creds) next();
  else res.redirect('/reroute')
};

/////////////////
//MIDDLEWARE END
////////////////


////////////////
// LOGIN START
////////////////

app.get('/signup', (req, res) => {
  if (req.session.user && req.cookies.creds)
    res.redirect('/reroute')
  else
    res.render('signup.ejs')
})

app.get('/signin', (req, res) => {
  if (req.session.user && req.cookies.creds)
    res.redirect('/reroute')
  else
    res.render('signin.ejs')
})

app.post("/signup", (req, res) => {
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
      res.redirect('/signin')
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
    res.redirect("/reroute");
  } catch (err) {
    console.error("Signin Error!");
    res.json(err);
  }
});


app.get('/reroute',(req,res)=>{
  if (req.session.role == "admin" && req.cookies.creds && req.session.user)
    res.redirect('/admin')
  else if (req.session.role == "user" && req.cookies.creds && req.session.user)
    res.redirect('/client-profile')
  else
    res.redirect('/signin')
})

////////////////
// LOGIN END
////////////////

/////////////////////
//ADMIN START
////////////////////

app.get("/admin",checkAdmin, async (req, res) => {
  var response = await axios.get('http://localhost:3001/api/products')
  res.render('adminui/admin',{products:response.data,user:req.session.user});
});

app.get("/create-item", (req, res) => {
  res.render('adminui/create_item');
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
  res.render('adminui/profile');
});

app.get("/edit-user", (req, res) => {
  res.render('adminui/edit_user');
});

app.get("/edit-item", (req, res) => {
  res.render('adminui/edit_item');
});

app.get("/edit-order", (req, res) => {
  res.render('adminui/edit_order');
});

app.get("/create-order", (req, res) => {
  res.render('adminui/create_order');
});

app.get("/create-item", (req, res) => {
  res.render('adminui/create_item');
});

app.get("/users", (req, res) => {
  res.render('adminui/users');
});

/////////////////////
//ADMIN END
////////////////////


////////////////////////
//CLIENT START
////////////////////////

app.get("/shop",checkUser, async (req, res) => {
  var response = await axios.get('http://localhost:3001/api/products')
  res.render('clientui/shop',{products:response.data});
});

app.get("/client-profile",checkUser, (req, res) => {
  res.render('clientui/profile',{user:req.session.user});
});

app.get("/cart", (req, res) => {
  res.render('clientui/cart');
});

app.get("/checkout", (req, res) => {
  res.render('clientui/checkout');
});

////////////////////////
//CLIENT END
////////////////////////


app.get("/", (req, res) => {
  res.redirect('/signin')
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
