const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('./models/User');
const app = express();
const PORT = 8080;

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
    // You might want to send the token back to the client to store in the client's session
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

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});