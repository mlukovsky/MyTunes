const User = require('../models/user')
const Review = require('../models/review')

module.exports.writeSongReview = async (req, res) => {
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
}

module.exports.deleteSongReview = async (req, res) => {
    const { id } = req.params;
    const review = await Review.findOne({ 'song.id': id })
    console.log(review)
    //removes anything out of the User object's reviews array that matches reviewID
    await User.findOneAndUpdate({ uri: req.user.id }, { $pull: { reviews: review._id } })
    await Review.findByIdAndDelete(review._id)
    req.flash('success', 'Successfully deleted review!')
    res.redirect(`/song/${id}`)
}

module.exports.writeAlbumReview = async (req, res) => {
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
}

module.exports.deleteAlbumReview = async (req, res) => {
    const { id } = req.params;
    const review = await Review.findOne({ 'album.id': id })
    console.log(review)
    //removes anything out of the User object's reviews array that matches reviewID
    await User.findOneAndUpdate({ uri: req.user.id }, { $pull: { reviews: review._id } })
    await Review.findByIdAndDelete(review._id)
    req.flash('success', 'Successfully deleted review!')
    res.redirect(`/album/${id}`)
}

module.exports.writeArtistReview = async (req, res) => {
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
}

module.exports.deleteArtistReview = async (req, res) => {
    const { id } = req.params;
    const review = await Review.findOne({ 'artist.id': id })
    console.log(review)
    //removes anything out of the User object's reviews array that matches reviewID
    await User.findOneAndUpdate({ uri: req.user.id }, { $pull: { reviews: review._id } })
    await Review.findByIdAndDelete(review._id)
    req.flash('success', 'Successfully deleted review!')
    res.redirect(`/artist/${id}`)
}