const express = require('express');
const router = express.Router();
const searchAndView = require('../controllers/searchAndView')
const { isLoggedIn } = require('../middleware')
const catchAsync = require('../helpers/catchAsync')

router.get('/', catchAsync(searchAndView.homePage))
router.get('/user/:id', isLoggedIn, catchAsync(searchAndView.userProfile))
router.route('/search')
    .get(isLoggedIn, searchAndView.searchForm)
    .post(searchAndView.getSearchResults)

router.get('/search/:query', searchAndView.displaySearchResults)

router.get('/song/:id', catchAsync(searchAndView.viewSong))
router.get('/album/:id', catchAsync(searchAndView.viewAlbum))
router.get('/artist/:id', catchAsync(searchAndView.viewArtist))


module.exports = router