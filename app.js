require('dotenv').config()
const express = require("express");
const ejs = require('ejs');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require('express-session')
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')



const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static("public"));

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
  }))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect('mongodb://127.0.0.1:27017/userDB');

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String,
    secret:[String],
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id, username: user.username });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID:     process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    passReqToCallback: true
    
  },
    function (request, accessToken, refreshToken, profile, done) {
      console.log(profile)
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));


app.get("/", (req, res) => {
    res.render("home")
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

app.get("/login", (req, res) => {
    res.render("login")
});

app.get("/register", (req, res) => {
    res.render("register")
});

app.get("/secrets", (req, res) => {
  User.find({ secret: { $ne: null } })
    .then(function (doc) {
      res.render("secrets", { userWithSecret: doc });
    })
    .then(function (err) {
      console.log(err)
    })
});

app.get("/submit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("submit")
  } else {
    res.redirect("/login")
  }
});

app.get("/logout", function (req, res) {
    req.logout(function(err) {
        if (err) {
            console.log(err);
        }
        res.redirect('/');
      });
    
});

app.post("/register", (req, res) => {
    User.register({ username: req.body.username }, req.body.password, (err, user) => {
        if (err) {
            console.log(err)
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets")
            });
        }
    });
});


app.post("/login", (req, res) => {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err)
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets")
            });
        }
    });
});

app.post("/submit", function (req, res) {
  console.log(req.user.id);
  User.findById(req.user.id)
    .then(function (doc) {
      doc.secret.push(req.body.secret);
      doc.save();
      res.redirect("/secrets")
    })
    .catch(function (err) {
      console.log(err);
    })
});

app.listen(3000, () => {
    console.log("Server started on port 3000")
});