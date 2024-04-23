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
    tags: {
        type: [{
            type: String,
            enum: ['Science Fiction', 'Fantasy', 'Gaming', 'Anime', 'Cartoon', 'Fanfiction', 
                   'Horror', 'Biography', 'Thriller', 'Minimalism', 'Expressionism', 'Impressionism', 
                   'Pop Art', 'Renaissance', 'Abstract', 'Modern', 'Romance', 'Adventure', 'History', 'Technology', 'Futurism']
        }],
        validate: [arrayLimit, 'Please add at least one tag']
    },
     },  
    {timestamps: true }); // Mongoose manages createdAt and updatedAt fields automatically

    function arrayLimit(val) {
        return val.length > 0;
      }

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
