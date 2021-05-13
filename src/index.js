require('dotenv').config();
const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cookieSession = require('cookie-session');

const PORT = process.env.PORT || 3000;
const app = express();

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user._json);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
    },
    function (accessToken, refreshToken, profile, cb) {
      return cb(null, profile);
    }
  )
);

// Configure Session Storage
app.use(
  cookieSession({
    name: 'passPortAuth',
    keys: ['randomKey', 'randomKey2'],
  })
);

// Configure Passport
app.use(passport.initialize());
app.use(passport.session());

app.get('/failed', (req, res) => {
  res.send('<h1>Log in Failed :(</h1>');
});

// Middleware - Check user is Logged in
const checkUserLoggedIn = (req, res, next) => {
  req.user ? next() : res.sendStatus(401);
};

// Auth Routes
app.get(
  '/auth/google',
  passport.authenticate('google', {scope: ['profile', 'email']})
);

app.get(
  '/auth/google/callback',
  passport.authenticate('google', {failureRedirect: '/failed'}),
  function (req, res) {
    res.redirect('/profile');
  }
);

// Logout
app.get('/logout', (req, res) => {
  req.session = null;
  req.logout();
  res.redirect('/');
});

// Protected Route.
app.get('/profile', checkUserLoggedIn, (req, res) => {
  res.send(
    `<a href='/'><div style="margin: 10px">&larr; Home</div></a>
    <img src="${req.user.picture}" alt="Profile picture" />
    <h3>${req.user.name}</h3>
    <p>Email: ${req.user.email}</p>
    <a href='/logout'>🙀 Logout</a>
    `
  );
});

app.get('/', (req, res) => {
  res.send(`
  <h1>Home</h1>
  ${
    !req.user
      ? `<a href='/auth/google'>😺 Login With Google</a>`
      : `<a href='/profile'>Open profile</a>`
  }
  `);
});

app.listen(PORT, () => console.log(`App running on port ${PORT}`));
