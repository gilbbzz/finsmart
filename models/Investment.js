const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Nama investasi wajib diisi'],
    trim: true,
    maxlength: [100, 'Nama maksimal 100 karakter']
  },
  
  instrumentType: {
    type: String,
    enum: ['saham', 'reksa_dana', 'deposito', 'emas', 'kripto', 'obligasi', 'properti', 'lainnya'],
    required: [true, 'Jenis instrumen wajib diisi']
  },
  
  principalAmount: {
    type: Number,
    required: [true, 'Modal awal wajib diisi'],
    min: [0, 'Modal tidak boleh negatif']
  },
  
  currentValue: {
    type: Number,
    required: [true, 'Nilai saat ini wajib diisi'],
    min: [0, 'Nilai tidak boleh negatif']
  },
  
  startDate: {
    type: Date,
    required: [true, 'Tanggal mulai wajib diisi']
  },
  
  ticker: {
    type: String,
    trim: true,
    uppercase: true,
    maxlength: [20, 'Ticker maksimal 20 karakter']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [300, 'Catatan maksimal 300 karakter']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  valueHistory: [
    {
      value: { type: Number, required: true },
      date: { type: Date, default: Date.now },
      note: { type: String, trim: true }
    }
  ]
}, { timestamps: true });


investmentSchema.virtual('profitLoss').get(function () {
  return this.currentValue - this.principalAmount;
});


investmentSchema.virtual('returnPercent').get(function () {
  if (this.principalAmount === 0) return 0;
  return parseFloat(((this.currentValue - this.principalAmount) / this.principalAmount * 100).toFixed(2));
});

investmentSchema.set('toJSON', { virtuals: true });
investmentSchema.set('toObject', { virtuals: true });

investmentSchema.index({ user: 1, instrumentType: 1 });
investmentSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('Investment', investmentSchema);
