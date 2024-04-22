const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    //attributes
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    imageUrls: [String], // Optional
    tags: [{
        type: String,
        enum: ['Science Fiction', 'Fantasy', 'Gaming', 'Anime', 'Cartoon', 'Fanfiction', 
        'Horror', 'Biography', 'Thriller', 'Minimalism', 'Expressionsim', 'Impressionism', 
        'Pop Art', 'Renaissance', 'Abstract', 'Modern', 'Romance', 'Adventure', 'History', 'Technology', 'Futurism'],
        required: false
    }],
     },  
    {timestamps: true }); // Mongoose manages createdAt and updatedAt fields automatically

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
