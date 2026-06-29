const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Judul target wajib diisi'],
    trim: true,
    maxlength: [100, 'Judul maksimal 100 karakter']
  },
  icon: {
    type: String,
    default: '🎯'
  },
  targetAmount: {
    type: Number,
    required: [true, 'Target nominal wajib diisi'],
    min: [1, 'Target minimal Rp 1']
  },
  savedAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tabungan tidak boleh negatif']
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline wajib diisi']
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  isClaimed: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });


goalSchema.virtual('progressPercent').get(function() {
  return Math.min(Math.round((this.savedAmount / this.targetAmount) * 100), 100);
});


goalSchema.virtual('remaining').get(function() {
  return Math.max(this.targetAmount - this.savedAmount, 0);
});

goalSchema.set('toJSON', { virtuals: true });
goalSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Goal', goalSchema);
