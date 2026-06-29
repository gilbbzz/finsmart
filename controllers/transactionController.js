const BaseController = require('./BaseController');
const Transaction    = require('../models/Transaction');

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class TransactionController extends BaseController {
  constructor() {
    super(Transaction);
  }

  
  async getAll(req, res) {
    try {
      const { type, category, startDate, endDate, search } = req.query;
      const filter = { user: req.user._id };

      if (type && ['income', 'expense'].includes(type)) filter.type = type;
      if (category) filter.category = category;

      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate)   filter.date.$lte = new Date(endDate + 'T23:59:59');
      }

      if (search) {
        const safeSearch = escapeRegex(search.trim());
        filter.note = { $regex: safeSearch, $options: 'i' };
      }

      const transactions = await Transaction.find(filter)
        .populate('category', 'name icon color')
        .sort({ date: -1 })
        .lean();

      return this.sendSuccess(res, transactions);
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async create(req, res) {
    try {
      const { type, amount, category, note, date } = req.body;
      if (!type || !amount || !category)
        return this.sendError(res, 'Tipe, nominal, dan kategori wajib diisi');

      const transaction = await Transaction.create({
        user: req.user._id,
        type,
        amount: Number(amount),
        category,
        note,
        date: date ? new Date(date) : new Date()
      });

      const populated = await transaction.populate('category', 'name icon color');
      return this.sendSuccess(res, populated, 'Transaksi berhasil ditambahkan', 201);
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async update(req, res) {
    try {
      const transaction = await Transaction.findOne({
        _id: req.params.id,
        user: req.user._id
      });

      if (!transaction)
        return this.sendError(res, 'Transaksi tidak ditemukan', 404);

      const { type, amount, category, note, date } = req.body;
      if (type)              transaction.type     = type;
      if (amount)            transaction.amount   = Number(amount);
      if (category)          transaction.category = category;
      if (note !== undefined) transaction.note    = note;
      if (date)              transaction.date     = new Date(date);

      await transaction.save();
      const populated = await transaction.populate('category', 'name icon color');
      return this.sendSuccess(res, populated, 'Transaksi berhasil diperbarui');
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async delete(req, res) {
    try {
      const transaction = await Transaction.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id
      });

      if (!transaction)
        return this.sendError(res, 'Transaksi tidak ditemukan', 404);

      return this.sendSuccess(res, null, 'Transaksi berhasil dihapus');
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async exportCSV(req, res) {
    try {
      const transactions = await Transaction.find({ user: req.user._id })
        .populate('category', 'name')
        .sort({ date: -1 })
        .lean();

      const headers = ['Tanggal', 'Tipe', 'Kategori', 'Nominal', 'Catatan'];
      const rows = transactions.map(t => [
        new Date(t.date).toLocaleDateString('id-ID'),
        t.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
        t.category?.name || '-',
        t.amount,
        t.note || '-'
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=transaksi-finsmart.csv');
      return res.send('\uFEFF' + csvContent);
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  
  async renderIndex(req, res) {
    try {
      const transactions = await Transaction.find({ user: req.user._id })
        .populate('category', 'name icon color')
        .sort({ date: -1 })
        .limit(50)
        .lean();

      
      
      res.render('transactions/index', {
        title:        'Daftar Transaksi',
        user:         req.user,
        transactions,
        formatRupiah: this.formatRupiah.bind(this)
      });
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }
}

const transactionController = new TransactionController();
module.exports = transactionController;
