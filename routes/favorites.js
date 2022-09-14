const express = require('express')
const router = express.Router()
const favorites = require('../controllers/favorites')

router.post('/addSongToProfile', favorites.addSong)
router.post('/addAlbumToProfile', favorites.addAlbum)
router.post('/addArtistToProfile', favorites.addArtist)

module.exports = router