require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const hbs = require('express-handlebars');
const session = require('express-session');
const passport = require('passport');
const mongoose = require('mongoose');
const morgan = require('morgan');
const { PORT, DATABASE_URL } = require('./config');

// routes
const { router: usersRouter } = require('./users');
const { router: authRouter, basicStrategy, jwtStrategy } = require('./auth');
const { router: jobsRouter } = require('./jobs');

mongoose.Promise = global.Promise;

// App init
const app = express();

// view engine
app.set('views', path.join(__dirname, '/views'));
app.engine('hbs', hbs({
    extname: 'hbs',
    defaultLayout: 'main',
    layoutsDir: __dirname + '/views/layouts/',
    partialsDir: __dirname + '/views/partials/'
}));
app.set('view engine', 'hbs');

// Bodyparser middleware
const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: false });

// express static middleware
app.use(express.static('public'));

// express session middleware
app.use(session({
    secret: 'cats',
    saveUninitialized: true,
    resave: true
}));

// passport init
app.use(passport.initialize());
app.use(passport.session());
passport.use(basicStrategy);
passport.use(jwtStrategy);

// global vars
app.use(function (req, res, next) {
    res.locals.user = req.user || null;
    console.log("req.user", req.user);
    console.log("res.locals.user", res.locals.user);
    // console.log("app.locals.user", app.locals.user);
    next();
});

// Logging
app.use(morgan('common'));

// CORS
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE');
    if (req.method === 'OPTIONS') {
        return res.send(204);
    }
    next();
});

//  ----- API FOR GETTING INDIVIDUAL PAGES ----- 
// get index
app.get('/', (req, res) => {
    res.render('index', {
        title: 'Lake Washington Gig Finder',
        nav: false
    });
});

// get job search page
app.get('/find', (req, res) => {
    res.render('find', {
        title: 'Gig Finder | Find',
        nav: true
    });
});

// // get job post page
// app.get('/post', checkAuth, (req, res) => {
//     res.render('post', {
//         title: 'Gig Finder | Post',
//         nav: true
//     });
// });

// // get job edit page
// app.get('/edit', checkAuth, (req, res) => {
//     res.render('edit', {
//         title: 'Gig Finder | Edit',
//         nav: true
//     });
// });

// // get registration page
app.get('/register', (req, res) => {
    res.render('register', {
        title: 'Gig Finder | Register',
        nav: true
    });
});

// get login page
// app.get('/login', (req, res) => {
//     console.log("req.user3", req.user);
//     res.render('login', {
//         title: 'Gig Finder | Login',
//         nav: true
//     });
// });

// 9/25/17 added removeHeader to fix dialog box popup when
// passport sends back 401
app.use(function (err, req, res, next) {
    console.log("req.user4", req.user);
    res.removeHeader('www-authenticate');
    next(err);
});

// A protected endpoint which needs a valid JWT to access it
// app.get('/protected',
//     passport.authenticate('jwt', { session: false }),
//     (req, res) => {
//         return res.json({
//             data: 'Beware of clowns!'
//         });
//     }
// );

// routes
app.use('/users/', usersRouter);
app.use('/auth/', authRouter);
app.use('/jobs/', jobsRouter);

// server start and stop functions
let server;

function runServer() {
    return new Promise((resolve, reject) => {
        mongoose.connect(DATABASE_URL, err => {
            useMongoClient: true;
            if (err) {
                return reject(err);
            }
            server = app.listen(PORT, () => {
                let dateTime = new Date();
                let hourMinute =
                    dateTime.getHours() +
                    ":" + (dateTime.getMinutes() < 10 ? '0' : '') +
                    dateTime.getMinutes();

                console.log(hourMinute + ` - I'm listening on ${PORT}...`);

                resolve();
            })
                .on('error', err => {
                    mongoose.disconnect();
                    reject(err);
                });
        });
    });
}

function closeServer() {
    return mongoose.disconnect().then(() => {
        return new Promise((resolve, reject) => {
            console.log('Server is down.');
            server.close(err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });
    });
}

if (require.main === module) {
    runServer().catch(err => console.error(err));
};

module.exports = { app, runServer, closeServer };