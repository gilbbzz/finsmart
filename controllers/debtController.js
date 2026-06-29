const BaseController = require('./BaseController');
const Debt = require('../models/Debt');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

class DebtController extends BaseController {
  constructor() {
    super(Debt);
  }

  
  async getAll(req, res) {
    try {
      const filter = { user: req.user._id };

      if (req.query.type && ['debt', 'receivable'].includes(req.query.type)) {
        filter.type = req.query.type;
      }
      if (req.query.isPaid !== undefined) {
        filter.isPaid = req.query.isPaid === 'true';
      }

      const debts = await Debt.find(filter)
        .sort({ isPaid: 1, dueDate: 1, createdAt: -1 })
        .lean({ virtuals: true });

      
      const allDebts = await Debt.find({ user: req.user._id }).lean({ virtuals: true });
      const summary = {
        totalDebt: allDebts.filter(d => d.type === 'debt' && !d.isPaid)
          .reduce((sum, d) => sum + (d.amount - d.paidAmount), 0),
        totalReceivable: allDebts.filter(d => d.type === 'receivable' && !d.isPaid)
          .reduce((sum, d) => sum + (d.amount - d.paidAmount), 0),
        paidCount: allDebts.filter(d => d.isPaid).length,
        activeCount: allDebts.filter(d => !d.isPaid).length
      };

      return this.sendSuccess(res, { debts, summary });
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async create(req, res) {
    try {
      const { type, personName, amount, description, dueDate } = req.body;

      if (!type || !personName || !amount) {
        return this.sendError(res, 'Tipe, nama orang, dan nominal wajib diisi');
      }
      if (!['debt', 'receivable'].includes(type)) {
        return this.sendError(res, 'Tipe harus "debt" atau "receivable"');
      }

      const debt = await Debt.create({
        user: req.user._id,
        type,
        personName: personName.trim(),
        amount: Number(amount),
        description,
        dueDate: dueDate ? new Date(dueDate) : undefined
      });

      return this.sendSuccess(res, debt.toJSON(), 'Data berhasil ditambahkan', 201);
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async update(req, res) {
    try {
      const debt = await Debt.findOne({ _id: req.params.id, user: req.user._id });
      if (!debt) return this.sendError(res, 'Data tidak ditemukan', 404);
      if (debt.isPaid) return this.sendError(res, 'Data yang sudah lunas tidak bisa diubah');

      const { personName, amount, description, dueDate } = req.body;

      if (personName) debt.personName = personName.trim();
      if (amount)     debt.amount     = Number(amount);
      if (description !== undefined) debt.description = description;
      if (dueDate)    debt.dueDate    = new Date(dueDate);

      await debt.save();
      return this.sendSuccess(res, debt.toJSON(), 'Data berhasil diperbarui');
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async delete(req, res) {
    try {
      const debt = await Debt.findOneAndDelete({ _id: req.params.id, user: req.user._id });
      if (!debt) return this.sendError(res, 'Data tidak ditemukan', 404);
      return this.sendSuccess(res, null, 'Data berhasil dihapus');
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async pay(req, res) {
    try {
      const { amount, note } = req.body;
      const payAmount = Number(amount);

      if (!amount || payAmount <= 0) {
        return this.sendError(res, 'Nominal pembayaran tidak valid');
      }

      const debt = await Debt.findOne({ _id: req.params.id, user: req.user._id });
      if (!debt) return this.sendError(res, 'Data tidak ditemukan', 404);
      if (debt.isPaid) return this.sendError(res, 'Hutang ini sudah lunas');

      const remaining = debt.amount - debt.paidAmount;
      if (payAmount > remaining) {
        return this.sendError(res, `Pembayaran tidak boleh melebihi sisa hutang (${this.formatRupiah(remaining)})`);
      }

      
      debt.payments.push({ amount: payAmount, date: new Date(), note: note || '' });
      debt.paidAmount += payAmount;

      
      if (debt.paidAmount >= debt.amount) {
        debt.isPaid = true;

        
        await this._createLunasTransaction(req.user._id, debt, payAmount);
      }

      await debt.save();

      return this.sendSuccess(res, debt.toJSON(), `Pembayaran ${this.formatRupiah(payAmount)} berhasil dicatat`);
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async _createLunasTransaction(userId, debt, payAmount) {
    try {
      
      
      const transType = debt.type === 'debt' ? 'expense' : 'income';
      const catName   = debt.type === 'debt' ? 'Bayar Hutang' : 'Terima Piutang';
      const catIcon   = debt.type === 'debt' ? '💸' : '💰';
      const catColor  = debt.type === 'debt' ? '#ef4444' : '#22c55e';

      let category = await Category.findOne({
        user: userId,
        name: catName,
        type: { $in: [transType, 'both'] }
      });

      if (!category) {
        category = await Category.create({
          user: userId,
          name: catName,
          icon: catIcon,
          color: catColor,
          type: transType
        });
      }

      await Transaction.create({
        user: userId,
        type: transType,
        amount: debt.amount, 
        category: category._id,
        note: `${catName}: ${debt.personName}`,
        date: new Date()
      });
    } catch (err) {
      
      console.error('Error creating lunas transaction:', err.message);
    }
  }
}

const debtController = new DebtController();
module.exports = debtController;
