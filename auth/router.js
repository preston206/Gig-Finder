const express = require('express');
const router = express.Router();
const passport = require('passport');
const { BasicStrategy } = require('passport-http');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const urlencodedParser = bodyParser.urlencoded({ extended: false });
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const path = require('path');
mongoose.Promise = global.Promise;

const config = require('../config');

const createAuthToken = user => {
  return jwt.sign({ user }, config.JWT_SECRET, {
    subject: user.username,
    expiresIn: config.JWT_EXPIRY,
    algorithm: 'HS256'
  });
};

const { router: authRouter, basicStrategy, jwtStrategy } = require('../auth');
const { User } = require('../users/models');

// 9/25/17 added failWithError to fix dialog box popup when passport sends back 401
const basicAuth = passport.authenticate('basic', { session: false, failWithError: true });
const jwtAuth = passport.authenticate('jwt', { session: false });

// protected job post route
// router.get('/post', jwtAuth, jsonParser, (req, res) => {
//   // res.sendFile(__dirname + '/public/post.html');
//   res.sendFile(path.join(__dirname, '../public', 'post.html'))
// });

// test login route
// router.post('/login', passport.authenticate('basic', {
//   successRedirect: '/find.html',
//   failureRedirect: '/test'
// }));

// test login route
// router.get('/login', function (req, res, next) {

//   passport.authenticate('basic', function (err, user, info) {
//     console.log(req.user);
//     req.logIn(user, function (err) {

//       // return res.sendFile(path.join(__dirname, '../public', 'find.html'))

//       return next('route')
//     });

//   })(req, res, next);
// });

// -----------------------------------------
// router.post('/login', function (req, res, next) {
//   // console.log(req);
//   passport.authenticate('basic', function (err, user, info) {
//     if (err) { console.log("error1"); return next(err); }
//     if (!user) { console.log("error2"); return res.redirect('/'); }
//     req.logIn(user, function (err) {
//       if (err) { return next(err); }
//       return res.redirect(path.join(__dirname, '../public', 'find.html'));
//     });
//   })(req, res, next);
// });
// -----------------------------------------

// get login page
router.get('/login', (req, res) => {
  res.render('login', {
    title: 'Gig Finder | Login',
    nav: true
  });
});

// get job post page
router.get('/post', authCheck, roleCheck, (req, res) => {
  res.render('post', {
    title: 'Gig Finder | Post',
    nav: true
  });
});

// get job edit page
router.get('/edit', authCheck, roleCheck, (req, res) => {
  res.render('edit', {
    title: 'Gig Finder | Edit',
    nav: true
  });
});


// test edit
// router.get('/edit',
//   passport.authenticate('jwt', { session: false }),
//   (req, res) => {
//     res.render('edit', {
//       title: 'Gig Finder | Edit',
//       nav: true
//     });
//   }
// );

// auth check to see if user has been authenticated
// if user has not been authed then redirect to login
function authCheck(req, res, next) {
  if (req.isAuthenticated()) {
    // console.log( req.user.role );
    return next();
  }
  else {
    // console.log({ req });
    req.flash('info_msg', 'You need to log in before you can post a job.');
    res.redirect('login');
  };
};

// role check to see if user is "company"
// if not then redirect to registration
// user needs to be registered as a company in order to post job
function roleCheck(req, res, next) {
  // console.log(req.user.role);
  if (req.user.role === "Company") {
    // console.log({ req });
    return next();
  }
  else {
    // console.log({ req });
    req.flash('info_msg', 'You need to register as a company before you can post or edit a job.');
    res.redirect('../register');
  };
};

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

// login route
// router.post('/login', basicAuth, (req, res) => {
//   // console.log(req.user);
//   const authToken = createAuthToken(req.user.apiRepr());
//   const id = req.user._id;
//   // console.log(authToken);
//   // console.log(id);

//   res.locals.user = req.user;
//   console.log("res.locals.user: ", res.locals.user);
//   console.log("isAuth: ", req.isAuthenticated());
//   res.json({ authToken, id, userObj: res.locals.user });
//   // res.sendFile(path.join(__dirname, '../public', 'find.html'));

//   // let localStorage;
//   // try {
//   //   localStorage = window.localStorage;
//   // }
//   // catch (error) {
//   //   console.log("denied.")
//   // };
//   // localStorage.setItem('authToken', authToken);
//   // res.render('find');
// });

// test route
// router.post('/login',
//   // The user provides a username and password to login
//   passport.authenticate('basic', { session: false }),
//   (req, res) => {

//     console.log("username: ", req.user.username);
//     res.sendFile(path.join(__dirname, '../public', 'find.html'))
//   }
// );

// login
router.post('/login',
  // The user provides a username and password to login
  passport.authenticate('basic', { session: true }),
  (req, res) => {

    let authToken = createAuthToken(req.user.apiRepr());
    let id = req.user._id;

    res.json({ authToken, id, userObj: res.locals.user });
  }
);

// logout
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success_msg', 'You have successfully logged out.');
  res.redirect('login');
});

// router.post('/login',
//   // The user provides a username and password to login
//   passport.authenticate('basic', { session: false }),
//   (req, res) => {

//     console.log("req.user.username", req.user.username);

//     const authToken = createAuthToken(req.user.apiRepr());

//     return User
//       .findById(req.user.id)
//       .then(user => {
//         if (user.apiToken == null) {
//           return User
//             .findByIdAndUpdate(req.user.id, { $set: { apiToken: authToken } })
//             .exec()
//         }
//         res.sendFile(path.join(__dirname, '../public', 'find.html'))
//       })
//   }
// );

router.post('/refresh',
  // The user exchanges an existing valid JWT for a new one with a later
  // expiration
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    const authToken = createAuthToken(req.user);
    res.json({ authToken });
  }
);

module.exports = { router };