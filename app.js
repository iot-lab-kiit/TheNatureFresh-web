var admin = require("firebase-admin");
var firebase = require('firebase/app')
var express = require("express");
var bodyParser = require("body-parser");
var { auth, storage } = require("./firebaseClientConfig.js");
var session = require("express-session");
var cookieParser = require("cookie-parser");
var serviceAccount = require("./credentials.json");
var axios = require('axios');
var multer = require('multer');
global.XMLHttpRequest = require("xhr2");
var app = express();

let upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10000000 }
}).single('image')

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
      expires: 900000,
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

app.post("/signup", upload, async (req, res) => {
  try {
    var bytes = new Uint8Array(req.file.buffer)
    var storageRef = storage.child(req.file.originalname)
    const response = await storageRef.put(bytes, { contentType: req.file.mimetype })
    var imageUrl = await storageRef.getDownloadURL()
  }
  catch (err) {
    console.log(e)
    res.json(e)
  }

  const {
    email,
    phoneNumber,
    password,
    urole,
    uaddress,
    firstName,
    lastName,
  } = req.body;

  admin
    .auth()
    .createUser({
      email,
      phoneNumber,
      password,
      displayName: `${firstName} ${lastName}`,
      photoURL: imageUrl,
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


app.get('/reroute', (req, res) => {
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

app.get("/admin", checkAdmin, async (req, res) => {
  var response = await axios.get('http://localhost:3001/api/products')
  res.render('adminui/admin', { products: response.data, user: req.session.user });
});

app.get("/create-item", checkAdmin, async (req, res) => {
  res.render('adminui/create_item', { user: req.session.user });
});

app.get("/orders", async (req, res) => {
  var response = await axios.get('http://localhost:3001/api/orders/')
  console.log(response.data);
  res.render('orders', { products: response.data });
});


app.post("/create-item", upload, async (req, res) => {

  const {
    name,
    price,
    description,
    quantity
  } = req.body;

  var bytes = new Uint8Array(req.file.buffer)
  var imageUrl;
  try {
    var storageRef = storage.child(req.file.originalname)
    const response = await storageRef.put(bytes, { contentType: req.file.mimetype })
    imageUrl = await storageRef.getDownloadURL()
    var obj = { image_url: imageUrl, item_name: name, item_description: description, price: price, qty_available: quantity }
    var apires = await axios.post('http://localhost:3001/api/products/add', obj)
    res.redirect('/admin')
  }
  catch (e) {
    res.send("Error!")
    console.error(e)
  }
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

app.get("/users", (req, res) => {
  res.render('adminui/users');
});

/////////////////////
//ADMIN END
////////////////////


////////////////////////
//CLIENT START
////////////////////////
const createOrder = (cart, add, del_chrgs, req) => {
  const ord_date = new Date()
  var tot = 0
  cart.products.forEach(item => {
    tot += parseFloat(item.price * item.qty_purchased)
    console.log(tot)
  })
  var order = {
    user_id: req.session.user.uid,
    phone_number: req.session.user.phoneNumber,
    address: add,
    order_date: ord_date,
    order_day: new Date().toDateString(),
    total: (tot + del_chrgs).toFixed(2),
    gst: (0.07 * tot).toFixed(2),
    delivery_charge: del_chrgs,
    cgst: (0.07 * 0.5 * tot).toFixed(2),
    sgst: (0.07 * 0.5 * tot).toFixed(2),
    cart: cart
  }
  return(order)
}


app.get("/client-profile", checkUser, async (req, res) => {
  var response = await axios.get(`http://localhost:3001/api/orders/${req.session.user.uid}`)
  res.render('clientui/profile', { user: req.session.user, address: req.session.address, orders: response.data });
});

var usercart = {
  products: [],
  itemCount: 0
}

app.get("/shop", checkUser, async (req, res) => {
  var response = await axios.get('http://localhost:3001/api/products')
  res.render('clientui/shop', { products: response.data, usercart: usercart, user: req.session.user });
});

app.post('/cart', checkUser, (req, res) => {
  var { cart } = req.body;
  usercart = cart;
  // console.log(usercart.products)
  res.status(200).json({ success: true });
})

app.get("/cart", checkUser, (req, res) => {
  res.render('clientui/cart', { cart: usercart, user: req.session.user })
});

app.get('/order-details/:id',checkUser, async(req,res)=>{
  var response = await axios.get(`http://localhost:3001/api/orders/ord/${req.params.id}`)
  console.log(response.data)
    res.render('clientui/order_detail',{ user: req.session.user,orders:response.data})
})

app.get("/checkout", checkUser, (req, res) => {
  res.render('clientui/checkout',{user: req.session.user,cart:usercart,address:req.session.address });
});

app.post("/checkout",checkUser,(req,res)=>{
  const { address } = req.body;
  var order  = createOrder(usercart,address, 50, req)
  res.json(order)
})

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
