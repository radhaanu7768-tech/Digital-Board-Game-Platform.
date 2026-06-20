const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true, minlength: 3 },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  elo: { type: Number, default: 1200 }
});

// Hash password helper
userSchema.statics.hashPassword = (password) => {
  return crypto.createHash('sha256').update(password + 'boardgame-salt').digest('hex');
};

userSchema.methods.verifyPassword = function(password) {
  return this.passwordHash === mongoose.model('User').hashPassword(password);
};

module.exports = mongoose.model('User', userSchema);
