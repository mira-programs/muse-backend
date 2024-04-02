// routes/posts.js
const express = require('express');
const router = express.Router();
const upload = require('./config');
const Post = require('./models/Post'); // Adjust the path as necessary


// POST route to create a new post and store in the database
router.post('/posts', upload.array('images'), async (req, res) => {
    const { title, content, author } = req.body;
    let imageUrls = []; // Extract imageUrl separately to handle if it's not provided

    // If imageUrl is not provided or you need to initialize it differently, adjust here
    if (req.files && req.files.length > 0) {
        // Assuming the path attribute contains the access URL/path for each image
        imageUrls = req.files.map(file => file.path);
    }// Ensures imageUrl is an array, even if it's not provided

    try {
        const newPost = new Post({
            title,
            content,
            author,
            imageUrls // This can now safely be an empty array if no image URLs were provided
        });

        await newPost.save();
        res.status(201).send(newPost);
    } catch (error) {
        res.status(400).send(error);
    }
});

//gets all the posts of your user 
router.get('/user-posts/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const userPosts = await Post.find({ author: userId });
        res.json(userPosts);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

module.exports = router;
