const express = require('express');
const router = express.Router();
const User = require('../models/user')
const users = require('../controllers/users')
const passport = require('passport');
const catchAsync = require('../helpers/catchAsync')
const multer = require('multer')
const { storage } = require('../cloudinary')
const upload = multer({ storage })


//SPOTIFY AUTHENTICATION ROUTES

router.get('/auth/error', users.authError)
router.get('/auth/spotify', passport.authenticate('spotify'))
router.get('/auth/spotify/callback', passport.authenticate('spotify', { failureRedirect: '/auth/error' }), catchAsync(users.authSpotifyCallback))
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
    .post(upload.single('picture'), catchAsync(users.registerAuthdUser))

router.route('/profileImg')
    .post(upload.single('image'), catchAsync(users.addProfileImg))
    .delete(catchAsync(users.deleteProfileImg))
    .put(upload.single('newImage'), catchAsync(users.editProfileImg))

//Render page to edit profile pic
router.get('/user/:id/editProfileImg', catchAsync(users.editProfileImgForm))

module.exports = router