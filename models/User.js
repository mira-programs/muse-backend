const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    // attributes go here
    firstName: {
        type:String,
        required: true
    },
    lastName: {
        type:String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true // Ensures usernames are unique across the database
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true,
    },

    emailVerified: {
        type: Boolean,
        required: true,
        default: false
    },

    temporaryVerificationCode: {
        type: String,
        required: false
    },

    profile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Profile',
        required: false
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;