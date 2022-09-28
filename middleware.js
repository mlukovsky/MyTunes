const axios = require('axios')
const Review = require('./models/review')

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        //req.session.returnTo = req.originalUrl;
        req.flash('error', 'You must be signed in to do that')
        return res.redirect('/login')
    }
    next();
}

module.exports.isSongReviewAuthor = async (req, res, next) => {
    const { id } = req.params;
    const review = await Review.findOne({ 'song.id': id })
    if (!review.author.equals(req.user.dbID)) {
        req.flash('error', "You don't have permisson to do that")
        return res.redirect(`/song/${id}`)
    }
    next();
}

module.exports.isAlbumReviewAuthor = async (req, res, next) => {
    const { id } = req.params;
    const review = await Review.findOne({ 'album.id': id })
    if (!review.author.equals(req.user.dbID)) {
        req.flash('error', "You don't have permisson to do that")
        return res.redirect(`/album/${id}`)
    }
    next();
}

module.exports.isArtistReviewAuthor = async (req, res, next) => {
    const { id } = req.params;
    const review = await Review.findOne({ 'artist.id': id })
    if (!review.author.equals(req.user.dbID)) {
        req.flash('error', "You don't have permisson to do that")
        return res.redirect(`/artist/${id}`)
    }
    next();
}