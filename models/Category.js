const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Nama kategori wajib diisi'],
    trim: true
  },
  icon: {
    type: String,
    default: '💰'
  },
  color: {
    type: String,
    default: '#6366f1'
  },
  type: {
    type: String,
    enum: ['income', 'expense', 'both'],
    default: 'both'
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });


categorySchema.index({ user: 1 });

module.exports = mongoose.model('Category', categorySchema);
