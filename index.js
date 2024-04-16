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

// Register user
app.post('/register', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).send('User already exists');
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      firstName,
      lastName,
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

// Login user
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send('Account does not exist.');
    }

    // Check if the password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send('Invalid credentials.');
    }

    // Check if the email has been verified
    if (!user.emailVerified) {
      return res.status(401).send('Please verify your email before logging in.');
    }

    // User matched and email is verified, create a token
    const token = jwt.sign({ userId: user._id }, jwtSecretKey, { expiresIn: '1h' });

    // Respond with token and redirect to homepage
    // send the token back to the client to store in the client's session
    res.json({
      token: token,
      message: 'Login successful. Redirecting to homepage...'
    });
    
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error during login.');
  }
});

// Email verification
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

    // Redirect user to the homepage after verification
    res.redirect('http://localhost:5173/homepage');
  } catch (error) {
    res.status(500).send('Server error');
  }
});


//app.use('/uploads', express.static('uploads'));


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


// autheticate user so that he/she are legitimate message senders by generating a token
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
    req.user = user;
    next();
  });
};


// Get the receiver's messages
app.get('/messages', authenticateToken, (req, res) => {
  Message.find({ receiver: req.user.userId })
         .sort({ timestamp: -1 })
         .limit(50)
         .populate('sender receiver')
         .then(messages => res.json(messages))
         .catch(err => res.status(500).json({ message: 'Error fetching messages', error: err }));
});


// stores message by message in database
app.post('/messages', authenticateToken,  (req, res) => {
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



// end
app.use('/uploads', express.static('uploads'));
module.exports = router;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});