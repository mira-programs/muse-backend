const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const app = express();
app.use(express.json()); // To parse JSON bodies
const PORT = 8080;
const multer = require('multer');
const router = express.Router();
const upload = require('./config');
const Post = require('./models/Post');
const Message = require('./models/Message'); 
const fs = require('fs');

app.use(express.json());
app.use(cors());
// MongoDB connection
//mongodb+srv://dalaibrahim10:GpuMt36JaMCP4Sbp@cluster0.pbbuaiw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
mongoose.connect('mongodb+srv://dalaibrahim10:GpuMt36JaMCP4Sbp@cluster0.pbbuaiw.mongodb.net/')
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err))

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail', // Example using Gmail. Change according to email provider
  auth: {
    user: 'dalaibrahim10@gmail.com', // email
    pass: 'andfypckrvoejmuy' // email password or app specific password
  }
});

// JWT secret key
const jwtSecretKey = '09f26e402586e2faa8da4c98a35f1b20d6cce13f0e7b48a69f14cb7db017973f'; // Change this to a strong secret key




// /*************************************************** REGISTER AND LOGIN ************************************************************/
// REGISTER ----------------------------------------------------------------------------------------------------------------
app.post('/register', async (req, res) => {
  const { firstName, lastName, username, email, password} = req.body;

  try {
    let user = await User.findOne({ $or: [{ email }, { username }] });

      if (user) {
          if (user.email === email) {
              return res.status(400).send('Email already exists');
          } else {
              return res.status(400).send('Username already exists');
          }
      }
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      emailVerified: false
    });

    const savedUser = await user.save();

    // Create a verification token
    const token = jwt.sign({ userId: savedUser._id }, jwtSecretKey, { expiresIn: '1h' });

    // Send verification email
    const verificationLink = `http://localhost:${PORT}/verify-email?token=${token}`;
    await transporter.sendMail({
      from: 'dalaibrahim10@gmail.com@gmail.com',
      to: savedUser.email,
      subject: 'Verify your email',
      html: `<p>Thank you for registering with MUSE! Please verify your email by clicking on the link below:</p><p><a href="${verificationLink}">${verificationLink}</a></p>`
    });

    res.send('Registration successful. Please check your email to verify your account.');
  } catch (error) {
    res.status(500).send('Server error');
  }
});


// LOGIN ----------------------------------------------------------------------------------------------------------------------
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Account does not exist.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    if (!user.emailVerified) {
      return res.status(401).json({ message: 'Please verify your email before logging in.' });
    }

    const token = jwt.sign({ userId: user._id }, jwtSecretKey, { expiresIn: '1h' });
    res.json({
      token: token,
      email: user.email,
      message: 'Login successful. Redirecting to homepage...'
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login.' });
  }
});


// EMAIL VERIFICATION ---------------------------------------------------------------------------------------------------------
app.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, jwtSecretKey);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(400).send('Invalid token');
    }

    user.emailVerified = true;
    await user.save();

    // Redirect user to the home page after verification
    res.redirect('http://localhost:5173/home');
  } catch (error) {
    res.status(500).send('Server error');
  }
});




/*************************************************** TOKEN ************************************************************/
const authenticateToken = (req, res, next) => {
    console.log("Authorization Header:", req.headers['authorization']);  // Log the full Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) {
        console.log("No token found");
        return res.sendStatus(401);
    }

    jwt.verify(token, jwtSecretKey, (err, user) => {
        if (err) {
            console.log("Token verification failed:", err);
            return res.sendStatus(403);
        }
        console.log("Token verified, user:", user);

        // Extend token if verification was successful
        const refreshedToken = jwt.sign({ userId: user.userId }, jwtSecretKey, { expiresIn: '2h' });  // Extend token for 2 hours
        res.setHeader('Authorization', 'Bearer ' + refreshedToken);  // Send the refreshed token back in the response header

        req.user = user;
        next();
    });
};





/**************************************************** POSTS ************************************************************/
// UPLOAD POSTS -------------------------------------------------------------------------------------------------------------
app.post('/posts', upload.array('imageUrls'), async (req, res) => {
  const { title, content, author } = req.body;

  let imageBase64Strings = [];

  // Convert each uploaded image to base64
  if (req.files && req.files.length > 0) {
      imageBase64Strings = await Promise.all(req.files.map(file => {
          return new Promise((resolve, reject) => {
              fs.readFile(file.path, (err, data) => {
                  if (err) reject(err);
                  // Convert image file to base64 string
                  const base64Image = Buffer.from(data).toString('base64');
                  resolve(base64Image);
              });
          });
      }));
      // Optionally, delete the files after converting them if they are no longer needed
      req.files.forEach(file => fs.unlinkSync(file.path));
  }

  try {
      const newPost = new Post({
          title,
          content,
          author,
          imageUrls: imageBase64Strings // Now storing base64 strings
      });

      await newPost.save();
      res.status(201).send(newPost);
  } catch (error) {
      res.status(400).send(error);
  }
});


// DISPLAY USER'S POSTS ------------------------------------------------------------------------------------------------------
// test on postman: localhost:8080/user-posts/user id
//gets all the posts of your user 
app.get('/user-posts/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
      const userPosts = await Post.find({ author: userId });
      res.json(userPosts);
  } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
  }
});





/**************************************************** HOMEPAGE ************************************************************/
// SEARCH BY TAG/USERNAME ----------------------------------------------------------------------------------------------------
// Unified search route for tags and usernames
app.get('/search', async (req, res) => {
  const { type, query } = req.query;

  if (!query) {
      return res.status(400).json({ error: 'Search query cannot be empty' });
  }

  try {
      if (type === 'tags') {
          const tagArray = query.split(',');
          if (tagArray.length === 0) {
              return res.status(400).json({ error: 'Tag list cannot be empty' });
          }
          const posts = await Post.find({ tags: { $all: tagArray } });
          if (posts.length === 0) {
              return res.status(404).json({ error: 'No posts found with the specified tags' });
          }
          res.json(posts);
      } else if (type === 'username') {
          const users = await User.find({ username: new RegExp('^' + query, 'i') }, 'username _id');
          if (users.length === 0) {
              return res.status(404).json({ error: 'No users found with the specified username' });
          }
          res.json(users);
      } else {
          res.status(400).json({ error: 'Invalid search type specified' });
      }
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error', message: error.message });
  }
});

// DISPLAY 10 POSTS ON HOMEPAGE ------------------------------------------------------------------------------------------------
// Endpoint to get the 10 most recent posts
app.get('/recent-posts', async (req, res) => {
  try {
      const posts = await Post.find({})
                              .sort({ createdAt: -1 }) // Sort by createdAt timestamp, descending
                              .limit(10); // Limit to 10 posts
      res.json(posts.map(post => ({ postId: post._id, title: post.title }))); // Simplified response for clarity
  } catch (error) {
      res.status(500).send('Error retrieving posts: ' + error.message);
  }
});

// to be added in the front endas the code correspongin to this backend segment
/*setInterval(() => {
    fetch('http://localhost:3000/recent-posts')
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error('Error fetching posts:', error));
}, 60000); */





/**************************************************** MESSAGES ************************************************************/
// GET MESSAGES ------------------------------------------------------------------------------------------------------------
// Get the receiver's messages
app.get('/chats/:userId', authenticateToken, (req, res) => {
  Message.find({ receiver: req.user.userId })
         .sort({ timestamp: -1 })
         .limit(50)
         .populate('sender receiver')
         .then(messages => res.json(messages))
         .catch(err => res.status(500).json({ message: 'Error fetching messages', error: err }));
});


// STORE MESSAGES -----------------------------------------------------------------------------------------------------------
// stores message by message in database
app.post('/chats/:userId', authenticateToken,  (req, res) => {
  console.log("Body:", req.body); // This will log the body content

  const { receiver, message } = req.body;
  if (!receiver) {
    return res.status(400).json({ message: "Receiver not defined" });
  }

  const newMessage = new Message({
      sender: req.user.userId,
      receiver,
      message
  });

  newMessage.save()
      .then(() => res.status(201).json({ message: 'Message sent successfully', data: newMessage }))
      .catch(err => res.status(500).json({ message: 'Error sending message', error: err }));
});


// Get chat list: all users a person has messaged or received messages from
app.get('/chats', authenticateToken, async (req, res) => {
  // const userId = req.user.userId;  // Set by your authenticateToken middleware
  const userId = new mongoose.Types.ObjectId(req.user.userId);  // Convert string ID to ObjectId
   try {
     const chatUsers = await Message.aggregate([
       {
         $match: {
           $or: [{ sender: userId }, { receiver: userId }]
         }
       },
       {
         $group: {
           _id: null,
           users: { $addToSet: "$sender", $addToSet: "$receiver" }
         }
       },
       {
         $project: {
           users: 1,
           _id: 0
         }
       },
       { $unwind: "$users" }, // Flatten the users array
       { $match: { users: { $ne: userId } } }, // Exclude the current user's id
       {
         $lookup: {
           from: "users", // Assuming 'users' is your collection name for User documents
           localField: "users",
           foreignField: "_id",
           as: "userDetails"
         }
       },
       { $unwind: "$userDetails" },
       {
         $project: { // Adjust fields according to your User model
           userId: "$userDetails._id",
           username: "$userDetails.username",
           email: "$userDetails.email"
         }
       }
     ]);
 
     res.json({ chatList: chatUsers });
   } catch (error) {
     console.error("Failed to retrieve chat list:", error);
     res.status(500).send("Server error while retrieving chat list");
   }
 });





/**************************************************** PROFILE ************************************************************/
// EDIT PROFILE ------------------------------------------------------------------------------------------------------------------
// Endpoint to update or create profile with profile picture, INCOMPLETE, USERID SHOULD COME FROM AUTHENTICATED SESSION
app.post('/profile', upload.single('profilePicture'), async (req, res) => {
  const { firstName, lastName, location, about, isOpenToCollaborate, experiences } = req.body;
  let profilePicture = '';

  // Convert the uploaded image to base64
  if (req.file) {
      const imgBuffer = req.file.buffer; // Accessing the file buffer
      profilePicture = imgBuffer.toString('base64');
  }

  // Assuming a user ID is used to find the existing profile
  const userId = req.body.userId; // This should come from authenticated session or token

  try {
      const profile = await profile.findOneAndUpdate(
          { user: userId }, // Use the user ID as a reference
          {
              profilePicture,
              firstName,
              lastName,
              location,
              about,
              isOpenToCollaborate,
              experiences: JSON.parse(experiences)
          },
          { new: true, upsert: true } // Creates a new document if no document matches the filter
      );
      res.status(201).json(profile);
  } catch (error) {
      res.status(500).send('Error updating profile: ' + error.message);
  }
});

// end
app.use('/uploads', express.static('uploads'));
module.exports = router;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});