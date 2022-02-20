const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const MongoDBStore = require('connect-mongodb-session')(session);

const app = express();
const dbURI = `mongodb+srv://${process.env.FOSdatabaseUsr}:${process.env.FOSdatabasePsw}@franceswebsite.dhbvc.mongodb.net/FoodOrderSysDB?retryWrites=true&w=majority`;

const Restaurants = require('./models/restaurantModel');
const Orders = require('./models/orderModel');
const Users = require('./models/userModel');

// express sessions data save to mongodb
const sessionStore = new MongoDBStore({
    uri: dbURI, collection: 'sessions'
});
sessionStore.on('error', err => { console.log(err)});

// import authentication and authorization functions
const sessionName = require('./authChecking').sessionName;
const checkAuth = require('./authChecking').checkAuth;
const checkUnAuth = require('./authChecking').checkUnAuth;


//**********************************************************************//
// middlewares
app.set('views');   // set 'views' folder to path
app.set('view engine', 'pug');
app.use(express.static('public'));  // static resources
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(session({
    name: sessionName,
    secret: 'Sometimes when they are deep in dreams, they are building true worlds in reality',
    cookie: {
        maxAge: 1000*60*60*2  // 2 hours
    },
    store: sessionStore,
    resave: true,
    saveUninitialized: false
}));

// log requests
app.use((req, res, next) => {
    console.log(`${req.method}: ${req.url}`);
    next();
});


//**********************************************************************//
// server routes
app.use(exposeDBURI);
app.use(exposeSession);

app.use("/users", require("./routers/user-router"));   // user router
app.use("/order", require("./routers/order-router"));   // order router
app.use("/restaurants", require("./routers/restaurant-router"));   // restaurant router

app.get('/', (req, res) => res.render('home'));  // home page
app.post('/login', checkUnAuth, login);
app.get('/logout', checkAuth, logout);


//**********************************************************************//
// FUNCTIONS

// store dbURI to res.locals so routers can access
function exposeDBURI(req, res, next) {
    res.locals.dbURI = dbURI;
    next();
}

// store session data to res.locals so template engine can access
function exposeSession(req, res, next) {
    if (req.session) res.locals.session = req.session;
    next();
}

function logout(req, res) {
    req.session.destroy();
    delete res.locals.session;
    res.status(200).redirect('/');
}

function login(req, res) {
    if (req.body.username && req.body.password && typeof req.body.username == 'string' && typeof req.body.password == 'string') {
        Users.findOne({username: req.body.username}, {username:1, password:1, admin:1})
        .exec((err, user) => {
            if (err) throw err;
            if (user == null) {
                res.status(401).send("Username does not exist");
                return;
            }
            if (user.password !== req.body.password) {
                res.status(401).send("Wrong password");
                return;
            }
            // console.log(user);
            req.session.loggedin = true;
            req.session.username = user.username;
            req.session.userID = user._id;
            req.session.admin = user.admin;
            req.session.sessionName = sessionName;
            res.locals.session = req.session;   // seems can be omitted
            res.status(200).send();
        });
    } else {
        res.status(400).send("Bad Request");
        return;
    }
}


//**********************************************************************//
// connect the database and start server
mongoose.connect(dbURI, {useNewUrlParser: true});
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    Restaurants.init(() => {
        Users.init(() => {
            Orders.init(() => {
                app.listen(process.env.PORT || 3000);
                console.log(`Server listening at port ${process.env.PORT || 3000}.`);
            });
        });
    });
});