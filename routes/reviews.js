const express = require('express')
const router = express.Router()
const reviews = require('../controllers/reviews')
const { isSongReviewAuthor, isAlbumReviewAuthor, isArtistReviewAuthor } = require('../middleware')
const catchAsync = require('../helpers/catchAsync')

router.route('/song/:id/reviews')
    .post(catchAsync(reviews.writeSongReview))
    .delete(isSongReviewAuthor, catchAsync(reviews.deleteSongReview))

router.route('/album/:id/reviews')
    .post(catchAsync(reviews.writeAlbumReview))
    .delete(isAlbumReviewAuthor, catchAsync(reviews.deleteAlbumReview))

router.route('/artist/:id/reviews')
    .post(catchAsync(reviews.writeArtistReview))
    .delete(isArtistReviewAuthor, catchAsync(reviews.deleteArtistReview))

module.exports = router