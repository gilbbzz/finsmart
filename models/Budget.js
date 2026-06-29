const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  limitAmount: {
    type: Number,
    required: [true, 'Limit budget wajib diisi'],
    min: [0, 'Limit tidak boleh negatif']
  },
  month: {
    type: String, 
    required: [true, 'Bulan wajib diisi'],
    match: [/^\d{4}-\d{2}$/, 'Format bulan: YYYY-MM']
  }
}, { timestamps: true });


budgetSchema.index({ user: 1, category: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
