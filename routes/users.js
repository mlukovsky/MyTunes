const express = require('express');
const router = express.Router();
const User = require('../models/user')
const users = require('../controllers/users')
const { isLoggedIn } = require('../middleware')
const passport = require('passport');


//SPOTIFY AUTHENTICATION ROUTES

router.get('/auth/error', users.authError)
router.get('/auth/spotify', passport.authenticate('spotify'))
router.get('/auth/spotify/callback', passport.authenticate('spotify', { failureRedirect: '/auth/error' }), users.authSpotifyCallback)
//SPOTIFY AUTHENTICATION ROUTES


router.route('/login')
    //Render Login page
    .get(users.loginForm)
    //Authenticate User
    .post(users.loginUser)

//Logout User
router.get('/logout', users.logoutUser)

router.route('/register')
    //Render register form
    .get(users.registerForm)
    //After connecting with spotify, render form where new user can choose a username and email
    .post(users.registerUser)

router.route('/registerAuthd')
    //After connecting with spotify, render form where new user can choose a username and email
    .get(users.registerAuthdForm)
    //create new user in database
    .post(users.registerAuthdUser)




module.exports = router