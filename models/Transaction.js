const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: [true, 'Tipe transaksi wajib diisi']
  },
  amount: {
    type: Number,
    required: [true, 'Nominal wajib diisi'],
    min: [0, 'Nominal tidak boleh negatif']
  },
  note: {
    type: String,
    trim: true,
    maxlength: [200, 'Catatan maksimal 200 karakter']
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });


transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1 });
transactionSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
