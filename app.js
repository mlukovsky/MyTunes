if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const flash = require('connect-flash')
const methodOverride = require('method-override');
const session = require('express-session')
const passport = require('passport');
const SpotifyStrategy = require('passport-spotify').Strategy;
const axios = require('axios')
const User = require('./models/user')


const { isLoggedIn } = require('./middleware')



mongoose.connect('mongodb://localhost:27017/my-tunes', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection;
db.on('error', console.error.bind(console, "connection error:"));
db.once('open', () => {
    console.log("Database connected");
});



app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))
app.use(methodOverride('_method'))
const sessionConfig = {
    secret: 'abadsecret',
    resave: true,
    rolling: true,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        //date.now gives milliseconds so this indicates that cookie will expire in one hour
        expires: Date.now() + 1000 * 60 * 60,
        maxAge: 1000 * 60 * 60
    }
}
app.use(session(sessionConfig))
app.use(flash())

passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (user, done) {
    done(null, user);
});

passport.use(new SpotifyStrategy({
    clientID: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    callbackURL: "http://localhost:1000/auth/spotify/callback"
},
    function (accessToken, refreshToken, profile, done) {
        return done(null, profile);
    }
));

app.use(passport.initialize());
app.use(passport.session());



app.use((req, res, next) => {
    res.locals.currentUser = req.user
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error')
    next();
})

//Adds the current logged in user's provided name and id stored in database to the req.user object. Used for displaying profile name in the navbar and 
//id for the link to the user profile
app.use(async function (req, res, next) {
    if (req.user) {
        const foundUser = await User.findOne({ uri: req.user.id })
        req.user.profileName = foundUser.username;
        req.user.dbID = foundUser._id;
    }
    next();
});



const userRoutes = require('./routes/users')
const searchAndViewRoutes = require('./routes/searchAndView')
const reviewRoutes = require('./routes/reviews')
const favoriteRoutes = require('./routes/favorites')


app.use('/', userRoutes, searchAndViewRoutes, reviewRoutes, favoriteRoutes)




app.listen(1000, () => {
    console.log('LISTENING ON PORT 1000')
})