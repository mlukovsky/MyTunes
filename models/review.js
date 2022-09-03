const mongoose = require('mongoose');
const { Schema } = mongoose;

const songSchema = new Schema({
    title: String,
    artist: String,
    id: String
})

const artistSchema = new Schema({
    name: String,
    id: String
})

const albumSchema = new Schema({
    title: String,
    artist: String,
    id: String
})

const reviewSchema = new Schema({
    body: String,
    rating: Number,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    song: songSchema,
    artist: artistSchema,
    album: albumSchema
});

module.exports = mongoose.model("Review", reviewSchema)