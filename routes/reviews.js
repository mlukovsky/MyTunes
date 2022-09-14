const express = require('express')
const router = express.Router()
const reviews = require('../controllers/reviews')

router.post('/song/:id/reviews', reviews.writeSongReview)
router.post('/album/:id/reviews', reviews.writeAlbumReview)
router.post('/artist/:id/reviews', reviews.writeArtistReview)

module.exports = router