const express        = require("express");
const passportRouter = express.Router();
// Require user model
const User= require("../models/user");
// Add bcrypt to encrypt passwords
const bcrypt=require("bcrypt");
const bcryptSalt=10;
// Add passport 
const passport= require("passport");
const LocalStrategy=require ("passport-local").Strategy;
passportRouter.use(passport.initialize());
passportRouter.use(passport.session());
const ensureLogin = require('../middlewares/ensureLoggedln');

const app_name = require("../package.json").name;

passportRouter.get("/signup", (req, res, next) => {
  res.render("passport/signup");
});

passportRouter.post("/signup", (req, res, next) => {
  const username = req.body.username;
  const password = req.body.password;

  if (username === "" || password === "") {
    res.render("passport/signup", { message: "Indicate username and password" });
    return;
  }

  User.findOne({ username })
  .then(user => {
    if (user !== null) {
      res.render("passport/signup", { message: "The username already exists" });
      return;
    }

    const salt = bcrypt.genSaltSync(bcryptSalt);
    const hashPass = bcrypt.hashSync(password, salt);

    const newUser = new User({
      username,
      password: hashPass
    });

    newUser.save((err) => {
      if (err) {
        res.render("passport/signup", { message: "Something went wrong" });
      } else {
        res.redirect("/");
      }
    });
  })
  .catch(error => {
    next(error)
  })
});
passport.serializeUser((user, cb) => {
  cb(null, user._id);
});

passport.deserializeUser((id, cb) => {
  User.findById(id, (err, user) => {
    if (err) { return cb(err); }
    cb(null, user);
  });
});


passport.use(
  new LocalStrategy((username, password, next) => {
    User.findOne({ username }, (err, user) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return next(null, false, { message: "Incorrect username" });
      }
      if (!bcrypt.compareSync(password, user.password)) {
        return next(null, false, { message: "Incorrect password" });
      }
      return next(null, user);
    });
  })
);

passportRouter.get("/login", (req, res, next) => {
  res.render("passport/login");
});

passportRouter.post("/login", passport.authenticate("local", {
  successRedirect: "/private-page",
  failureRedirect: "/",
  failureFlash: false,
  passReqToCallback: false
}));



passportRouter.get("/private-page", ensureLogin('/'), (req, res) => {
  res.render("passport/private", { user: req.user });
});

module.exports = passportRouter;