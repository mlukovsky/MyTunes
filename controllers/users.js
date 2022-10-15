const User = require('../models/user')
const axios = require('axios')
let registering = false;
const { cloudinary, storage } = require('../cloudinary')
const multer = require('multer')
const upload = multer({ storage })

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
    registering = false;
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
module.exports.registerAuthdForm = async (req, res) => {
    const user = await User.findOne({ uri: req.user.id });
    if (user) {
        req.flash('success', `Welcome back, ${user.username}`);
        return res.redirect('/');
    }
    const displayName = (req.user !== null) ? req.user.displayName : '';
    res.render('users/register', { registering, displayName })
}

//create new user in database
module.exports.registerAuthdUser = async (req, res) => {
    const usernameExists = await User.findOne({ username: req.body.name }).count() > 0 ? true : false
    if (usernameExists) {
        req.flash('error', 'That username already exists. Please choose a different one.')
        return res.redirect('/registerAuthd')
    }
    registering = false;
    const { name, email } = req.body;
    const { provider, id, uri } = req.user;
    const user = new User({
        email,
        username: name,
        platform: provider,
        uri: id
    });
    if (req.file) {
        user.profileImage = {
            url: req.file.path,
            filename: req.file.filename
        }
    }
    await user.save();
    req.flash('success', `Welcome, ${name}!`)
    res.redirect('/')
}

module.exports.addProfileImg = async (req, res) => {
    const user = await User.findOne({ uri: req.user.id });
    user.profileImage = {
        url: req.file.path,
        filename: req.file.filename
    };
    await user.save();
    res.redirect(`/user/${user._id}`);
}

module.exports.editProfileImgForm = async (req, res) => {
    const user = await User.findById(req.params.id)
    res.render('users/editProfileImg', { user });
}

module.exports.deleteProfileImg = async (req, res) => {
    const { filename } = req.body;
    await cloudinary.uploader.destroy(filename);
    const user = await User.findOne({ uri: req.user.id });
    await user.updateOne({ $unset: { profileImage: "" } })
    await user.save();
    req.flash('success', 'Profile Picture Deleted!')
    res.redirect(`/user/${user._id}`);
}

module.exports.editProfileImg = async (req, res) => {
    await cloudinary.uploader.destroy(req.body.oldImgFilename);
    const user = await User.findOne({ uri: req.user.id });
    await user.updateOne({ $unset: { profileImage: "" } });
    user.profileImage = {
        url: req.file.path,
        filename: req.file.filename
    }
    await user.save();
    req.flash('success', 'Your profile picture has been changed!');
    res.redirect(`/user/${user._id}`);
}