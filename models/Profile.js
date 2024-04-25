const mongoose = require('mongoose');
const { Schema } = mongoose;

const profileSchema = new Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    profilePicture: { 
        type: String, 
        required: false 
    },
    firstName: { 
        type: String, 
        required: true 
    },
    lastName: { 
        type: String, 
        required: true 
    },
    location: { 
        type: String, 
        required: false 
    },
    about: { 
        type: String, 
        required: false 
    },
    isOpenToCollaborate: { 
        type: Boolean, 
        required: false, 
        default: false 
    },
    experiences: [{
        title: { type: String, required: false },
        company: { type: String, required: false },
        description: { type: String, required: false },
        from: { type: Date, required: false },
        to: { type: Date, required: false }
    }]
}, { timestamps: true });

const Profile = mongoose.model('Profile', profileSchema);
module.exports = Profile;