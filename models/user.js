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

const userSchema = new Schema({
    email: {
        type: String,
        unique: false
    },
    username: {
        type: String,
        required: true
    },
    platform: {
        type: String,
        enum: ['spotify'],
        required: true
    },
    uri: {
        type: String,
        required: true,
        unique: true
    },
    songs: [songSchema],
    artists: [artistSchema],
    albums: [albumSchema],
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ]
})


module.exports = mongoose.model('User', userSchema);