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
const Profile = require('./models/Profile');
const Message = require('./models/Message'); 
const fs = require('fs');
const dir = './uploads';
const Report = require('./models/Report');

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
      emailVerified: false,
    });

    // create and save new user without initializing the profile attribute yet
    const savedUser = await user.save();

    // create default profile using new userId
    const profile = new Profile({
      userId: savedUser._id,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName
    });
    const savedProfile = await profile.save();
  
    // Update the user with the profile ID
    savedUser.profile = savedProfile._id;
    await savedUser.save();

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

    res.json({
      userId: user._id,  // the logged in user's userId, stored in local storage
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



app.use('/uploads', express.static('uploads'));

  //  // Verify that tags is an array and is not empty
  //  if (!Array.isArray(tags) || tags.length === 0) {
  //   return res.status(400).send({ error: "Tags are required and must be provided as an array." });
  // }

/**************************************************** POSTS ************************************************************/
// UPLOAD POSTS -------------------------------------------------------------------------------------------------------------
app.post('/posts', upload.array('imageUrls'), async (req, res) => {
  const { title, content, author } = req.body;
  console.log('Received tags:', req.body.tags);
  console.log('Received title:', title);
  console.log('Received content:', content);
  console.log('Received author:', author);
  console.log('Received files:', req.files);

  let tags;
  try {
    if (req.body.tags) {
      tags = JSON.parse(req.body.tags);
      console.log('Parsed tags:', tags);
    }
  } catch (error) {
    console.error('Error parsing tags:', error);
    return res.status(400).send({ message: "Invalid tags format", error: error.toString() });
  }

  let imageBase64Strings = [];
  try {
    if (req.files && req.files.length > 0) {
        imageBase64Strings = await Promise.all(req.files.map(file => {
            return new Promise((resolve, reject) => {
                fs.readFile(file.path, (err, data) => {
                    if (err) {
                        console.error('Error reading file:', err);
                        reject(err);
                    } else {
                        const base64Image = Buffer.from(data).toString('base64');
                        resolve(base64Image);
                    }
                });
            });
        }));
        req.files.forEach(file => fs.unlinkSync(file.path));
    }
  } catch (error) {
    console.error('Error processing images:', error);
    return res.status(500).send({ message: "Error processing images", error: error.toString() });
  }

  try {
      const newPost = new Post({
          title,
          content,
          author,
          imageUrls: imageBase64Strings,
          tags
      });
      await newPost.save();
      res.status(201).send(newPost);
  } catch (error) {
      console.error('Error saving new post:', error);
      res.status(400).send({ message: "Failed to save the post", error: error.message, details: error.errors });
  }
});


// ADD TO THE ARRAY OF COMMENTS UNDER POST WITH POST ID
app.post('/posts/:postId/comments', async (req, res) => {
  const { body, commenter } = req.body; // Comment body and commenter ID from the client
  const newComment = {
      body: body,
      commenter: commenter
  };
  try {
      const post = await Post.findByIdAndUpdate(req.params.postId, { $push: { comments: newComment } }, { new: true }).populate('comments.commenter');
      res.status(201).json(post.comments);
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});


// GETS ALL COMMENTS UNDER 1 POST USING POSTID
app.get('/posts/:postId/comments', async (req, res) => {
  try {
      const post = await Post.findById(req.params.postId).populate('comments.commenter', 'username email');
      if (post) {
          res.status(200).json(post.comments); //json array
      } else {
          res.status(404).send('Post not found');
      }
  } catch (error) {
      res.status(500).json({ message: error.message });
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



// DELETE USER'S POSTS ------------------------------------------------------------------------------------------------------
app.delete('/posts/:id', async (req, res) => {
  const userId = req.headers.id;  // Fetching user email from headers
  const adminEmail = "musecollaborate@gmail.com";

  try {
      const post = await Post.findById(req.params.id).populate('author');
      if (!post) {
          return res.status(404).send('Post not found');
      }

      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).send('User not found');
      }


      if (user.email === adminEmail || post.author.id.equals(userId)) {
          await Post.deleteOne({ _id: req.params.id });
          return res.send('Post deleted successfully');
      } else {
          return res.status(403).send('Unauthorized to delete this post');
      }
  } catch (error) {
      console.error('Error:', error);
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
          const users = await User.find({ username: new RegExp('^' + query, 'i') }); // find user based on username
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


// DISPLAY POSTS ON HOMEPAGE ------------------------------------------------------------------------------------------------
app.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find({})
                                .populate({
                                    path: 'author',
                                    populate: {
                                      path: 'profile'
                                    }
                                })
                                .sort({ createdAt: -1 }); 
      res.json(posts.map(post => ({ postID: post._id, 
                                    Image: post.imageUrls, 
                                    tags: post.tags, 
                                    muserID: post.author, 
                                    title: post.title, 
                                    des: post.content
                                    // profileID: post.author.profile ? post.author.profile._id : null
                                    // authorName: post.author.firstName + ' ' + post.author.lastName,
                                    // profilePicture: post.author.profile ? post.author.profile.profilePicture : null
                                })));
  } catch (error) {
      res.status(500).send('Error retrieving posts: ' + error.message);
  }
});


// get user's profile by profile ID (used from homepage)
app.get('/userProfile', async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.profileId);
    if (!profile) {
      return res.status(404).send('Profile not found');
    }
    res.json(profile);
  } catch (error) {
    res.status(500).send('Error retrieving profile: ' + error.message);
  }
});



/**************************************************** MESSAGES ************************************************************/
// GET MESSAGES ------------------------------------------------------------------------------------------------------------
app.get('/chats', (req, res) => {
  const userId = req.query.userId; // Extract user ID from request body
  Message.find({ receiver: userId })
         .sort({ timestamp: -1 })
         .limit(50)
         .populate('sender receiver')
         .then(messages => res.json(messages))
         .catch(err => res.status(500).json({ message: 'Error fetching messages', error: err }));
});



// SEND MESSAGES -----------------------------------------------------------------------------------------------------------
// stores message by message in database
app.post('/chats', (req, res) => {
  console.log("Body:", req.body); // This will log the body content
  const userId =req.query.userId;

  const { receiver, message} = req.body; // Extract user ID from request body
  if (!userId || !receiver) {
    return res.status(400).json({ message: "User ID or receiver not defined" });
  }

  const newMessage = new Message({
      sender: userId, // Use the extracted user ID as the sender
      receiver,
      message
  });

  newMessage.save()
      .then(() => res.status(201).json({ message: 'Message sent successfully', data: newMessage }))
      .catch(err => res.status(500).json({ message: 'Error sending message', error: err }));
});



/**************************************************** PROFILE ************************************************************/
// RETRIEVE PROFILE FOR USER------------------------------------------------------------------------------------------------------
// Endpoint to get a user's profile by userId
app.get('/profile/:userId', async (req, res) => {
  try {
      const { userId } = req.params;
      // Validate the userId is a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).send('Invalid user ID format');
      }

      // Fetch the user with the profile populated
      const user = await User.findById(userId).populate('profile');
      if (!user) {
          return res.status(404).send('User not found');
      }

      // Check if the user has a profile
      if (!user.profile) {
          return res.status(404).send('Profile not found for this user');
      }

      // Send back the profile data
      res.json(user.profile);
  } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).send('Server error while retrieving profile');
  }
});



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
  const userId = req.body.userId; // This should come from teh frontend 

  try {
      const profile = await Profile.findOneAndUpdate(
          { userId: userId }, // Use the user ID as a reference
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





/**************************************************** REPORTS ************************************************************/
// report a user ---------------------------------------------------------------------------------------------------------------
app.post('/report', async (req, res) => {
  const { reporterId, reportedId, reason } = req.body;
  
  if (!reporterId || !reportedId || !reason) {
      return res.status(400).send({ message: 'All fields are required.' });
  }

  try {
      const report = new Report({
          reporter: reporterId,
          reported: reportedId,
          reason: reason
      });
      await report.save();
      res.status(201).send({ message: 'Report has been filed.' });
  } catch (error) {
      res.status(500).send({ message: 'Failed to create report', error: error.message });
  }
});


// Route to fetch reports with user details ----------------------------------------------------------------------------------
// app.get('/report', async (req, res) => {
//   try {
//       const reports = await Report.find()
//           .sort({ timestamp: -1 })
//           .populate('reporter', 'username')  // Populating the username of the reporter
//           .populate('reported', 'username'); // Populating the username of the reported
//       res.status(200).json(reports);
//   } catch (error) {
//       res.status(500).send({ message: 'Failed to fetch reports', error: error.message });
//   }
// });

app.get('/report', async (req, res) => {
  const adminId =req.query.userId; // Admin ID sent from the frontend
  const adminEmail = "musecollaborate@gmail.com";
  
  try {
      // First, verify the admin user
      const adminUser = await User.findById(adminId);
      if (adminUser.email !== adminEmail) {
          res.status(403).send("Access denied. Only specific admins can perform this action.");
          return;
      }

      // If admin verification is successful, proceed to fetch reports
      const reports = await Report.find()
          .sort({ timestamp: -1 })
          .populate('reporter', 'username')  // Populating the username of the reporter
          .populate('reported', 'username'); // Populating the username of the reported
      res.status(200).json(reports);
  } catch (error) {
      if (error.kind === 'ObjectId' && error.path === '_id') {
          res.status(400).send({ message: 'Invalid admin ID format', error: error.message });
          return;
      }
      res.status(500).send({ message: 'Failed to fetch reports', error: error.message });
  }
});


app.delete('/delete-user/:id', async (req, res) => {
  const userid = req.params.id; // ID of the user to delete
  const adminId = req.headers.userId; // Admin ID sent from the frontend

  const adminEmail = "musecollaborate@gmail.com";
  
  try {
    // First, verify the admin user
    const adminUser = await User.findById(adminId);
    if (!adminUser || adminUser.email !== adminEmail) {
      res.status(403).send("Access denied. Only specific admins can perform this action.");
      return;
    }

    // If verification is successful, proceed to delete the specified user
    const user = await User.findById(userid);
    if (!user) {
      res.status(404).send("User not found.");
      return;
    }

    const deletedUser = await User.findByIdAndDelete(userid);
    if (deletedUser) {
      res.send("User deleted successfully.");
    } else {
      res.status(404).send("User not found.");
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Error processing your request.");
  }
});

module.exports = router;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});