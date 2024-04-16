// models/Message.js
const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: String,
 // mediaUrl: { type: String, default: null },  // Correctly formatted field with default value
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);
module.exports = Message;