

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const axios = require('axios')
const flash = require('connect-flash')
const methodOverride = require('method-override');
const session = require('express-session')
const passport = require('passport');
const User = require('./models/user')
const Review = require('./models/review')
const SpotifyStrategy = require('passport-spotify').Strategy;
const { isLoggedIn } = require('./middleware')
let registering = false;


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
    if (req.user && !registering) {
        const foundUser = await User.findOne({ uri: req.user.id })
        req.user.profileName = foundUser.username;
        req.user.dbID = foundUser._id;
    }
    next();
});


//HOME PAGE
app.get('/', async (req, res) => {
    res.render('home')
})

//SPOTIFY AUTHENTICATION ROUTES
app.get('/auth/error', (req, res) => {
    req.flash('error', "Something went wrong")
    res.redirect('/')
})

app.get('/auth/spotify', passport.authenticate('spotify'));

app.get('/auth/spotify/callback', passport.authenticate('spotify', { failureRedirect: '/auth/error' }),
    async function (req, res) {
        if (!registering) {
            const currUser = await User.findOne({ uri: req.user.id })
            req.flash('success', `Welcome back, ${currUser.username}!`)
            return res.redirect('/');
        }
        res.redirect('/registerAuthd')
    }
);
//SPOTIFY AUTHENTICATION ROUTES

//User Login Page
app.get('/login', (req, res) => {
    res.render('users/login')
})

//Authenticate user
app.post('/login', async (req, res) => {
    res.redirect('/auth/spotify')

})

//User Registration Page
app.get('/register', (req, res) => {
    res.render('users/register', { registering })
})

//Upon connecting with spotify, will redirect to registerAuthd where user will provide a username and email
app.post('/register', (req, res) => {
    registering = true;
    res.redirect('/auth/spotify')
})


//After connecting with spotify, render form where new user can choose a username and email
app.get('/registerAuthd', (req, res) => {
    const displayName = req.user.displayName
    res.render('users/register', { registering, displayName })
})

//create new user in database
app.post('/registerAuthd', async (req, res) => {
    registering = false;
    const { name, email } = req.body;
    const { provider, id, uri } = req.user;
    const user = new User({ email, username: name, platform: provider, uri: id });
    await user.save();
    req.flash('success', `Welcome, ${name}!`)
    res.redirect('/')
})

//Logout User 
app.get('/logout', (req, res, next) => {
    req.logout(err => {
        if (err) { return next(err); }
        //req.flash('success', 'You have been logged out')
        res.redirect('/');
    })
})

let token = ''
//User Profile also request access token
app.get('/user/:id', isLoggedIn, async (req, res) => {
    if (!token) {
        axios({
            url: 'https://accounts.spotify.com/api/token',
            method: 'post',
            params: {
                grant_type: 'client_credentials'
            },
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            auth: {
                username: process.env.SPOTIFY_CLIENT_ID,
                password: process.env.SPOTIFY_CLIENT_SECRET
            }
        }).then(function (response) {
            token = response.data.access_token
            console.log(token)
        }).catch(function (error) {
            console.log(error)
        });
    }
    const user = await User.findById(req.params.id).populate('reviews')
    res.render('users/profile', { user })
})

//token is spotify API access token. results will hold search results

const results = {
    titles: new Set(),
    ids: []
};


//Request access token, once received redirect to /searchAuthd
app.get('/search', isLoggedIn, (req, res) => {
    axios({
        url: 'https://accounts.spotify.com/api/token',
        method: 'post',
        params: {
            grant_type: 'client_credentials'
        },
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        auth: {
            username: process.env.SPOTIFY_CLIENT_ID,
            password: process.env.SPOTIFY_CLIENT_SECRET
        }
    }).then(function (response) {
        token = response.data.access_token
        //console.log(response.data, token)
        res.redirect('/searchAuthd')
    }).catch(function (error) {
        console.log(error)
    });

})

//Render search page
app.get('/searchAuthd', (req, res) => {
    console.log(token)
    console.log(results)
    res.render('search/search', { results })

})

// const dataFinder = (query) => {
//     const types = query.substring(query.indexOf('type'),query.indexOf('&limit'));
//     if(types.includes('track')){

//     }
// }


//When search form submitted, call API and show results
app.post('/searchAuthd', (req, res) => {

    const { song, artist, album } = req.body
    let url = ''
    let type = '';
    //URL used for API request are determined by which fields the user fills out (Song, Artist, Album)
    if (!song && !artist && !album) { req.flash('error', 'You must fill in at least one of the fields') }
    switch (true) {
        case (song && !artist && !album):
            url = `?q=${song.replaceAll(' ', '%20')}&type=track&limit=10&offset=0&market=US`
            break;
        case (artist && !song && !album):
            url = `?q=${artist.replaceAll(' ', '%20')}&type=artist&limit=10&offset=0&market=US`
            break;
        case (album && !song && !artist):
            url = `?q=${album.replaceAll(' ', '%20')}&type=album&limit=10&offset=0&market=US`
            break;
        case (song && artist && !album):
            url = `?q=track:${song.replaceAll(' ', '%20')}+artist:${artist.replaceAll(' ', '%20')}&type=track,artist&limit=10&offset=0&market=US`
            break;
        case (song && album && !artist):
            url = `?q=track:${song.replaceAll(' ', '%20')}+album:${album.replaceAll(' ', '%20')}&type=track,album&limit=10&offset=0&market=US`
            break;
        case (artist && album && !song):
            url = `?q=artist:${artist.replaceAll(' ', '%20')}+album:${album.replaceAll(' ', '%20')}&type=artist,album&limit=10&offset=0&market=US`
            break;
        default:
            url = `?q=track:${song.replaceAll(' ', '%20')}+artist:${artist.replaceAll(' ', '%20')}+album:${album.replaceAll(' ', '%20')}&type=track,artist,album&limit=10&offset=0&market=US`
    }
    axios({
        baseURL: 'https://api.spotify.com/v1/search',
        headers: {
            'Accept': 'application/json',
            Authorization: `Bearer ${token}`
        },
        url: url
    }).then(function (response) {
        if (response.data.tracks) {
            type = 'tracks'
            for (let item of response.data.tracks.items) {
                results.titles.add(`SONG: ${item.artists[0].name} - ${item.name}`);
                results.ids.push(item.id)
            }
        } else if (response.data.albums) {
            type = 'albums'
            for (let item of response.data.albums.items) {
                results.titles.add(`ALBUM: ${item.name} by ${item.artists[0].name}`)
                results.ids.push(item.id)
            }
        } else if (response.data.artists) {
            type = 'artists'
            for (let item of response.data.artists.items) {
                results.titles.add(item.name)
                results.ids.push(item.id)
            }
        }
        console.log(results)
        if (type === 'tracks') {
            res.redirect(`/searchAuthd/${response.data.tracks.href.slice(response.data.tracks.href.indexOf('query'))}`)
        } else if (type === 'albums') {
            res.redirect(`/searchAuthd/${response.data.albums.href.slice(response.data.albums.href.indexOf('query'))}`)
        } else {
            res.redirect(`/searchAuthd/${response.data.artists.href.slice(response.data.artists.href.indexOf('query'))}`)
        }
    }).catch(function (error) {
        console.log(error)
    });

})


//Display search results
app.get('/searchAuthd/:query', (req, res) => {
    res.render('search/searchResults', { results })
})


//View a song by id
app.get('/song/:id', async (req, res) => {
    const { id } = req.params;
    const reviews = await Review.find({ 'song.id': id }).populate('author')
    axios({
        url: `https://api.spotify.com/v1/tracks/${id}`,
        headers: {
            'Accept': 'application/json',
            Authorization: `Bearer ${token}`
        }
    }).then(function (response) {
        const data = response.data;
        res.render('song/show', { data, reviews })
    }).catch(function (error) {
        console.log(error)
    })
})

//Write a review for a song
app.post('/song/:id/reviews', async (req, res) => {
    //res.send(req.body)
    const { id } = req.params;
    const user = await User.findOne({ uri: req.user.id });
    const review = new Review(req.body.review);
    review.song = req.body.song
    review.author = user._id
    user.reviews.push(review)
    await review.save();
    await user.save();
    req.flash('success', 'Created new review!')
    res.redirect(`/song/${id}`)
})

//View an album by id
app.get('/album/:id', async (req, res) => {
    const { id } = req.params;
    const reviews = await Review.find({ 'album.id': id }).populate('author')
    axios({
        url: `https://api.spotify.com/v1/albums/${id}`,
        headers: {
            'Accept': 'application/json',
            Authorization: `Bearer ${token}`
        }
    }).then(function (response) {
        const data = response.data;
        res.render('album/show', { data, reviews })
    }).catch(function (error) {
        console.log(error)
    })
})

//Write a review for an album
app.post('/album/:id/reviews', async (req, res) => {
    //res.send(req.body)
    const { id } = req.params;
    const user = await User.findOne({ uri: req.user.id });
    const review = new Review(req.body.review);
    review.album = req.body.album
    review.author = user._id
    user.reviews.push(review)
    await review.save();
    await user.save();
    req.flash('success', 'Created new review!')
    res.redirect(`/album/${id}`)
})

//View an artist by id
app.get('/artist/:id', async (req, res) => {
    const { id } = req.params;
    const reviews = await Review.find({ 'artist.id': id }).populate('author')
    let artistData = {};
    let topTracks = {};
    let albums = {};
    let relatedArtists = {};
    //Get artist data
    await axios({
        url: `https://api.spotify.com/v1/artists/${id}`,
        headers: {
            'Accept': 'application/json',
            Authorization: `Bearer ${token}`
        }
    }).then(function (response) {
        artistData = response.data;
    }).catch(function (error) {
        console.log(error)
    })
    //Get artist's top tracks
    await axios({
        url: `https://api.spotify.com/v1/artists/${id}/top-tracks?market=US`,
        headers: {
            'Accept': 'application/json',
            Authorization: `Bearer ${token}`
        }
    }).then(function (response) {
        topTracks = response.data;
    }).catch(function (error) {
        console.log(error)
    })
    //Get artist's albums
    await axios({
        url: `https://api.spotify.com/v1/artists/${id}/albums?include_groups=album&market=US&limit=30`,
        headers: {
            'Accept': 'application/json',
            Authorization: `Bearer ${token}`
        }
    }).then(function (response) {
        albums = response.data;
    }).catch(function (error) {
        console.log(error)
    })
    //Get related artists
    await axios({
        url: `https://api.spotify.com/v1/artists/${id}/related-artists`,
        headers: {
            'Accept': 'application/json',
            Authorization: `Bearer ${token}`
        }
    }).then(function (response) {
        relatedArtists = response.data;
        res.render('artist/show', { artistData, topTracks, albums, relatedArtists, reviews })
    }).catch(function (error) {
        console.log(error)
    })
})

//Write a review for an artist
app.post('/artist/:id/reviews', async (req, res) => {
    //res.send(req.body)
    const { id } = req.params;
    const user = await User.findOne({ uri: req.user.id });
    const review = new Review(req.body.review);
    review.artist = req.body.artist;
    review.author = user._id
    user.reviews.push(review)
    await review.save();
    await user.save();
    req.flash('success', 'Created new review!')
    res.redirect(`/artist/${id}`)
})

//When you add an artist to your favorites
app.post('/addArtistToProfile', async (req, res) => {
    const user = await User.findOne({ uri: req.user.id })
    const { name, id, url } = req.body
    delete req.body.url;
    user.artists.push(req.body);
    await user.save();
    req.flash('success', `${name} added to favorites!`)
    res.redirect(url)
})

//When you add a song to your favorites
app.post('/addSongToProfile', async (req, res) => {
    console.log(req.body)
    const user = await User.findOne({ uri: req.user.id })
    const { title, artist, id, url } = req.body
    delete req.body.url;
    user.songs.push(req.body);
    await user.save();
    req.flash('success', `${title} added to favorites!`)
    res.redirect(url)
})

//When you add an album to your favorites
app.post('/addAlbumToProfile', isLoggedIn, async (req, res) => {

    const user = await User.findOne({ uri: req.user.id })
    const { title, artist, id, url } = req.body
    delete req.body.url;
    user.albums.push(req.body);
    await user.save();
    req.flash('success', `${title} added to favorites!`)
    res.redirect(url)
})


app.listen(1000, () => {
    console.log('LISTENING ON PORT 1000')
})