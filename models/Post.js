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
        enum: ['Science Fiction', 'Fantasy', 'Game', 'Anime', 'Cartoon', 'Fanfiction', 
        'Horror', 'Biography', 'Thriller', 'Minimalism', 'Expressionsim', 'Impressionism', 
        'Pop Art', 'Renaissance', 'Abstract', 'Modern', 'Romance', 'Adventure', 'History', 'Technology', 'Futurism'],
        required: true
    }],
    comments: [{ // Nested schema for comments directly within a post
        body: String,
        date: { type: Date, default: Date.now },
        commenter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users who liked the post
    // status: {
    //     type: String,
    //     enum: ['draft', 'published'],
    //     default: 'draft'
    //     // Post status to manage drafts and published posts
     },  
    {timestamps: true }); // Mongoose manages createdAt and updatedAt fields automatically

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
