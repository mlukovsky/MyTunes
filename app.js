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
const ExpressError = require('./helpers/ExpressError')
const { isLoggedIn } = require('./middleware')
const mongoSanitize = require('express-mongo-sanitize')
const helmet = require('helmet')
// const MongoStore = require('connect-mongo')

// 'mongodb://localhost:27017/my-tunes'
mongoose.connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection;
db.on('error', console.error.bind(console, "connection error:"));
db.once('open', () => {
    console.log("Database connected");
});

const secret = process.env.SECRET;

// const store = MongoStore.create({
//     mongoUrl: process.env.DB_URL,
//     secret,
//     touchAfter: 24 * 3600
// });

// store.on("error", function (err) {
//     console.log("SESSION STORE ERROR", err)
// })

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))
app.use(methodOverride('_method'))
const sessionConfig = {
    name: process.env.SESSION_NAME,
    secret,
    // store,
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
app.use(mongoSanitize())
app.use(helmet({ crossOriginEmbedderPolicy: false }))

const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
    "https://unpkg.com/"
]

const styleSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://cdn.jsdelivr.net/"
]

app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: [],
        connectSrc: ["'self'", "https://api.spotify.com/", "https://stats.g.doubleclick.net/j/"],
        frameSrc: ["https://open.spotify.com/"],
        scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
        styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
        workerSrc: ["'self'", "blob:"],
        objectSrc: [],
        imgSrc: [
            "'self'",
            "blob:",
            "data:",
            `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`,
            "https://i.scdn.co/"
        ],
        fontSrc: ["'self'", "https://open.spotifycdn.com/fonts/"],
        formAction: ["'self'", "https://accounts.spotify.com/"]
    }
}))

passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (user, done) {
    done(null, user);
});

passport.use(new SpotifyStrategy({
    clientID: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    callbackURL: `http://localhost:${process.env.PORT}/auth/spotify/callback`
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
    let foundUser;
    if (req.user) {
        foundUser = await User.findOne({ uri: req.user.id })
    }
    if (foundUser) {
        req.user.profileName = foundUser.username;
        req.user.dbID = foundUser._id;
        if (foundUser.profileImage) {
            req.user.profilePicUrl = foundUser.profileImage.url;
        }
    }
    next();
});



const userRoutes = require('./routes/users')
const searchAndViewRoutes = require('./routes/searchAndView')
const reviewRoutes = require('./routes/reviews')
const favoriteRoutes = require('./routes/favorites')

app.use('/', userRoutes, searchAndViewRoutes, reviewRoutes, favoriteRoutes)


//For requests to nonexistent routes
app.all('*', (req, res, next) => {
    next(new ExpressError(404, 'Page Not Found'))
})

//ERROR HANDLER
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Something went wrong!'
    res.status(statusCode).render('error', { err })
})

app.listen(process.env.PORT || 3000, () => {
    console.log('LISTENING ON PORT ' + process.env.PORT)
})