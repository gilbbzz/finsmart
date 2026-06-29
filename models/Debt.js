const mongoose = require('mongoose');

const debtSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  
  type: {
    type: String,
    enum: ['debt', 'receivable'],
    required: [true, 'Tipe hutang piutang wajib diisi']
  },
  personName: {
    type: String,
    required: [true, 'Nama orang wajib diisi'],
    trim: true,
    maxlength: [100, 'Nama maksimal 100 karakter']
  },
  amount: {
    type: Number,
    required: [true, 'Nominal wajib diisi'],
    min: [1, 'Nominal minimal Rp 1']
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: [0, 'Pembayaran tidak boleh negatif']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [300, 'Deskripsi maksimal 300 karakter']
  },
  dueDate: {
    type: Date
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  
  payments: [
    {
      amount: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      note: { type: String, trim: true }
    }
  ]
}, { timestamps: true });


debtSchema.virtual('remainingAmount').get(function () {
  return Math.max(this.amount - this.paidAmount, 0);
});


debtSchema.virtual('paidPercent').get(function () {
  return Math.min(Math.round((this.paidAmount / this.amount) * 100), 100);
});

debtSchema.set('toJSON', { virtuals: true });
debtSchema.set('toObject', { virtuals: true });

debtSchema.index({ user: 1, isPaid: 1 });
debtSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('Debt', debtSchema);
