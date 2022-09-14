const User = require('../models/user')
const axios = require('axios')
let registering = false;


//SPOTIFY AUTHENTICATION ROUTES
module.exports.authError = (req, res) => {
    req.flash('error', "Something went wrong")
    res.redirect('/')
}

module.exports.authSpotifyCallback = async function (req, res) {
    if (!registering) {
        const currUser = await User.findOne({ uri: req.user.id })
        req.flash('success', `Welcome back, ${currUser.username}!`)
        return res.redirect('/');
    }
    res.redirect('/registerAuthd')
}
//SPOTIFY AUTHENTICATION ROUTES

//User Login Page
module.exports.loginForm = (req, res) => {
    res.render('users/login')
}

//Authenticate User
module.exports.loginUser = (req, res) => {
    res.redirect('/auth/spotify')
}

//Logout User
module.exports.logoutUser = (req, res, next) => {
    req.logout(err => {
        if (err) { return next(err); }
        //req.flash('success', 'You have been logged out')
        res.redirect('/');
    })
}

//Render Register Form
module.exports.registerForm = (req, res) => {
    res.render('users/register', { registering })
}

//After connecting with spotify, render form where new user can choose a username and email
module.exports.registerUser = (req, res) => {
    registering = true;
    res.redirect('/auth/spotify')
}

//After connecting with spotify, render form where new user can choose a username and email
module.exports.registerAuthdForm = (req, res) => {
    const displayName = req.user.displayName
    res.render('users/register', { registering, displayName })
}

//create new user in database
module.exports.registerAuthdUser = async (req, res) => {
    registering = false;
    const { name, email } = req.body;
    const { provider, id, uri } = req.user;
    const user = new User({ email, username: name, platform: provider, uri: id });
    await user.save();
    req.flash('success', `Welcome, ${name}!`)
    res.redirect('/')
}
