const mongoose = require('mongoose');

const recurringSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Judul wajib diisi'],
    trim: true,
    maxlength: [100, 'Judul maksimal 100 karakter']
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Tipe transaksi wajib diisi']
  },
  amount: {
    type: Number,
    required: [true, 'Nominal wajib diisi'],
    min: [1, 'Nominal minimal Rp 1']
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly'],
    default: 'monthly'
  },
  
  dayOfMonth: {
    type: Number,
    min: 1,
    max: 31,
    default: 1
  },
  startDate: {
    type: Date,
    required: [true, 'Tanggal mulai wajib diisi']
  },
  endDate: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastExecuted: {
    type: Date
  },
  
  executionCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

recurringSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('Recurring', recurringSchema);
