const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type:      String,
    required:  [true, 'Nama wajib diisi'],
    trim:      true,
    maxlength: [50, 'Nama maksimal 50 karakter']
  },
  email: {
    type:      String,
    required:  [true, 'Email wajib diisi'],
    unique:    true,
    lowercase: true,
    trim:      true,
    match:     [/^\S+@\S+\.\S+$/, 'Format email tidak valid']
  },
  password: {
    type:      String,
    
    minlength: [8, 'Password minimal 8 karakter'],
    select:    false
  },

  
  googleId: {
    type:   String,
    unique: true,
    sparse: true   
  },
  avatar: {
    type:    String,
    default: ''    
  },
  authProvider: {
    type:    String,
    enum:    ['local', 'google'],
    default: 'local'
  },

  
  refreshTokenHash: {
    type:    String,
    select:  false,
    default: null
  },
  currency: { type: String, default: 'IDR' }
}, { timestamps: true });


userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt    = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;  
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
