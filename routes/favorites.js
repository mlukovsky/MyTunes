const express = require('express')
const router = express.Router()
const favorites = require('../controllers/favorites')

router.post('/addSongToProfile', favorites.addSong)
router.post('/addAlbumToProfile', favorites.addAlbum)
router.post('/addArtistToProfile', favorites.addArtist)
router.delete('/deleteSongFromProfile', favorites.deleteSong)
router.delete('/deleteAlbumFromProfile', favorites.deleteAlbum)
router.delete('/deleteArtistFromProfile', favorites.deleteArtist)


module.exports = router