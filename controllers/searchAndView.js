const axios = require('axios')
const User = require('../models/user')
const Review = require('../models/review')
//token is spotify API access token. results will hold search results
let token = ''

const results = {
    titles: new Set(),
    ids: []
};

//HOME PAGE
module.exports.homePage = async (req, res) => {
    if (!token) {
        await axios({
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
        }).catch(function (error) {
            console.log(error)
        });
    }
    if (req.user) {
        const idArray = []
        let hasContent = true;
        let randomSongID, randomArtistID, url, data;
        const user = await User.findOne({ uri: req.user.id })
        if (user.songs.length) {
            randomSongID = user.songs[Math.floor(Math.random() * user.songs.length)].id
            idArray.push(`song ${randomSongID}`)
        }
        if (user.artists.length) {
            randomArtistID = user.artists[Math.floor(Math.random() * user.artists.length)].id
            idArray.push(`artist ${randomArtistID}`)
        }
        const index = Math.floor(Math.random() * idArray.length)
        if (!idArray.length) { return res.render('home', { hasContent: false }) }
        switch (true) {
            case (idArray[index].includes('song')):
                url = `https://api.spotify.com/v1/recommendations?seed_tracks=${randomSongID}&market=US&limit=80`
                break;
            case (idArray[index].includes('artist')):
                url = `https://api.spotify.com/v1/recommendations?seed_artists=${randomArtistID}&market=US&limit=80`
                break;
        }
        await axios({
            url: url,
            headers: {
                'Accept': 'application/json',
                Authorization: `Bearer ${token}`
            }
        }).then(function (response) {
            data = response.data
        }).catch(function (error) {
            console.log(error)
        })
        return res.render('home', { data, hasContent })
    }
    res.render('home')
}

//Show user profile by ID and request access token
module.exports.userProfile = async (req, res) => {

    console.log(token)
    const user = await User.findById(req.params.id).populate('reviews')
    res.render('users/profile', { user })
}

//Request access token and Render Search page
module.exports.searchForm = async (req, res) => {
    console.log(token)
    console.log(results)
    res.render('search/search', { results })
}

//When search form submitted, call API and show results
module.exports.getSearchResults = (req, res) => {
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
        //GET QUERY STRING FOR URL TO DISPLAY SEARCH RESULTS
        if (type === 'tracks') {
            res.redirect(`/search/${response.data.tracks.href.slice(response.data.tracks.href.indexOf('query'))}`)
        } else if (type === 'albums') {
            res.redirect(`/search/${response.data.albums.href.slice(response.data.albums.href.indexOf('query'))}`)
        } else {
            res.redirect(`/search/${response.data.artists.href.slice(response.data.artists.href.indexOf('query'))}`)
        }
    }).catch(function (error) {
        console.log(error)
    });
}

//Display Search results
module.exports.displaySearchResults = (req, res) => {
    res.render('search/searchResults', { results })
}

//View song by ID
module.exports.viewSong = async (req, res) => {
    const { id } = req.params;
    const user = await User.findOne({ uri: req.user.id })
    //Determine if the user has the currently viewed song in their favorites
    const isFavorite = user.songs.some(el => el.id === id)
    const reviews = await Review.find({ 'song.id': id }).populate('author')
    axios({
        url: `https://api.spotify.com/v1/tracks/${id}`,
        headers: {
            'Accept': 'application/json',
            Authorization: `Bearer ${token}`
        }
    }).then(function (response) {
        const data = response.data;
        res.render('song/show', { data, reviews, isFavorite })
    }).catch(function (error) {
        console.log(error)
    })
}

//View album by ID
module.exports.viewAlbum = async (req, res) => {
    const { id } = req.params;
    const user = await User.findOne({ uri: req.user.id })
    //Determine if the user has the currently viewed album in their favorites
    const isFavorite = user.albums.some(el => el.id === id)
    const reviews = await Review.find({ 'album.id': id }).populate('author')
    axios({
        url: `https://api.spotify.com/v1/albums/${id}`,
        headers: {
            'Accept': 'application/json',
            Authorization: `Bearer ${token}`
        }
    }).then(function (response) {
        const data = response.data;
        res.render('album/show', { data, reviews, isFavorite })
    }).catch(function (error) {
        console.log(error)
    })
}

//View artist by ID
module.exports.viewArtist = async (req, res) => {
    const { id } = req.params;
    const user = await User.findOne({ uri: req.user.id })
    //Determine if the user has the currently viewed artist in their favorites
    const isFavorite = user.artists.some(el => el.id === id)
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
        res.render('artist/show', { artistData, topTracks, albums, relatedArtists, reviews, isFavorite })
    }).catch(function (error) {
        console.log(error)
    })
}