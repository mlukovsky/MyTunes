const User = require('../models/user')

module.exports.addSong = async (req, res) => {
    console.log(req.body)
    const user = await User.findOne({ uri: req.user.id })
    const { title, artist, id, url } = req.body
    delete req.body.url;
    user.songs.push(req.body);
    await user.save();
    req.flash('success', `${title} added to favorites!`)
    res.redirect(url)
}

module.exports.addAlbum = async (req, res) => {

    const user = await User.findOne({ uri: req.user.id })
    const { title, artist, id, url } = req.body
    delete req.body.url;
    user.albums.push(req.body);
    await user.save();
    req.flash('success', `${title} added to favorites!`)
    res.redirect(url)
}

module.exports.addArtist = async (req, res) => {
    const user = await User.findOne({ uri: req.user.id })
    const { name, id, url } = req.body
    delete req.body.url;
    user.artists.push(req.body);
    await user.save();
    req.flash('success', `${name} added to favorites!`)
    res.redirect(url)
}