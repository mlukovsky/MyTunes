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

const imageSchema = new Schema({
    url: String,
    filename: String
})

imageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200')
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
    profileImage: imageSchema,
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