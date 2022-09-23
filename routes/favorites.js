const express = require('express')
const router = express.Router()
const favorites = require('../controllers/favorites')
const catchAsync = require('../helpers/catchAsync')

router.post('/addSongToProfile', catchAsync((favorites.addSong)))
router.post('/addAlbumToProfile', catchAsync((favorites.addAlbum)))
router.post('/addArtistToProfile', catchAsync((favorites.addArtist)))
router.delete('/deleteSongFromProfile', catchAsync((favorites.deleteSong)))
router.delete('/deleteAlbumFromProfile', catchAsync((favorites.deleteAlbum)))
router.delete('/deleteArtistFromProfile', catchAsync((favorites.deleteArtist)))


module.exports = router