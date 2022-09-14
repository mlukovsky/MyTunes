const express = require('express');
const router = express.Router();
const searchAndView = require('../controllers/searchAndView')
const { isLoggedIn } = require('../middleware')


router.get('/user/:id', isLoggedIn, searchAndView.userProfile)
router.route('/search')
    .get(isLoggedIn, searchAndView.searchForm)
    .post(searchAndView.getSearchResults)

router.get('/search/:query', searchAndView.displaySearchResults)

router.get('/song/:id', searchAndView.viewSong)
router.get('/album/:id', searchAndView.viewAlbum)
router.get('/artist/:id', searchAndView.viewArtist)


module.exports = router