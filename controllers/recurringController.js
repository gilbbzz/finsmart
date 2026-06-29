const BaseController = require('./BaseController');
const Recurring = require('../models/Recurring');
const Transaction = require('../models/Transaction');

class RecurringController extends BaseController {
  constructor() {
    super(Recurring);
  }

  
  async getAll(req, res) {
    try {
      const filter = { user: req.user._id };
      if (req.query.isActive !== undefined) {
        filter.isActive = req.query.isActive === 'true';
      }

      const recurring = await Recurring.find(filter)
        .populate('category', 'name icon color')
        .sort({ isActive: -1, createdAt: -1 })
        .lean();

      
      const enriched = recurring.map(r => ({
        ...r,
        nextExecution: this._getNextExecutionDate(r),
        frequencyLabel: this._getFrequencyLabel(r.frequency)
      }));

      return this.sendSuccess(res, enriched);
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async create(req, res) {
    try {
      const { title, type, amount, category, frequency, dayOfMonth, startDate, endDate } = req.body;

      if (!title || !type || !amount || !category || !startDate) {
        return this.sendError(res, 'Judul, tipe, nominal, kategori, dan tanggal mulai wajib diisi');
      }

      const recurring = await Recurring.create({
        user: req.user._id,
        title: title.trim(),
        type,
        amount: Number(amount),
        category,
        frequency: frequency || 'monthly',
        dayOfMonth: dayOfMonth ? Number(dayOfMonth) : 1,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined
      });

      const populated = await recurring.populate('category', 'name icon color');

      return this.sendSuccess(res, populated.toJSON(), 'Transaksi berulang berhasil dibuat', 201);
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async update(req, res) {
    try {
      const { title, amount, frequency, dayOfMonth, endDate, isActive } = req.body;

      const recurring = await Recurring.findOne({ _id: req.params.id, user: req.user._id });
      if (!recurring) return this.sendError(res, 'Data tidak ditemukan', 404);

      if (title   !== undefined) recurring.title      = title.trim();
      if (amount  !== undefined) recurring.amount     = Number(amount);
      if (frequency !== undefined) recurring.frequency = frequency;
      if (dayOfMonth !== undefined) recurring.dayOfMonth = Number(dayOfMonth);
      if (endDate !== undefined) recurring.endDate    = endDate ? new Date(endDate) : undefined;
      if (isActive !== undefined) recurring.isActive  = isActive;

      await recurring.save();
      const populated = await recurring.populate('category', 'name icon color');

      return this.sendSuccess(res, populated.toJSON(), 'Data berhasil diperbarui');
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async delete(req, res) {
    try {
      const recurring = await Recurring.findOneAndDelete({ _id: req.params.id, user: req.user._id });
      if (!recurring) return this.sendError(res, 'Data tidak ditemukan', 404);
      return this.sendSuccess(res, null, 'Data berhasil dihapus');
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async execute(req, res) {
    try {
      const recurring = await Recurring.findOne({ _id: req.params.id, user: req.user._id });
      if (!recurring) return this.sendError(res, 'Data tidak ditemukan', 404);
      if (!recurring.isActive) return this.sendError(res, 'Transaksi ini sudah tidak aktif');

      
      const transaction = await Transaction.create({
        user: req.user._id,
        type: recurring.type,
        amount: recurring.amount,
        category: recurring.category,
        note: `[Berulang] ${recurring.title}`,
        date: new Date()
      });

      const populated = await transaction.populate('category', 'name icon color');

      
      recurring.lastExecuted  = new Date();
      recurring.executionCount += 1;
      await recurring.save();

      return this.sendSuccess(res, { transaction: populated, recurring }, `Transaksi "${recurring.title}" berhasil dieksekusi`);
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async executeDue(req, res) {
    try {
      const today = new Date();
      const todayDay = today.getDate();

      
      const allRecurring = await Recurring.find({
        user: req.user._id,
        isActive: true,
        startDate: { $lte: today },
        $or: [{ endDate: null }, { endDate: { $gte: today } }]
      });

      const results = [];
      for (const rec of allRecurring) {
        if (this._isDueToday(rec, today, todayDay)) {
          
          if (rec.lastExecuted) {
            const last = new Date(rec.lastExecuted);
            if (last.getFullYear() === today.getFullYear() &&
                last.getMonth() === today.getMonth() &&
                last.getDate() === today.getDate()) {
              continue; 
            }
          }

          const t = await Transaction.create({
            user: req.user._id,
            type: rec.type,
            amount: rec.amount,
            category: rec.category,
            note: `[Berulang] ${rec.title}`,
            date: new Date()
          });

          rec.lastExecuted   = new Date();
          rec.executionCount += 1;
          await rec.save();
          results.push({ title: rec.title, amount: rec.amount, type: rec.type });
        }
      }

      return this.sendSuccess(res, results,
        results.length > 0
          ? `${results.length} transaksi berulang berhasil dieksekusi`
          : 'Tidak ada transaksi berulang yang jatuh tempo hari ini'
      );
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  

  _isDueToday(rec, today, todayDay) {
    switch (rec.frequency) {
      case 'daily':
        return true;
      case 'weekly':
        return today.getDay() === new Date(rec.startDate).getDay();
      case 'monthly':
        return todayDay === rec.dayOfMonth;
      case 'yearly':
        const sd = new Date(rec.startDate);
        return today.getDate() === sd.getDate() && today.getMonth() === sd.getMonth();
      default:
        return false;
    }
  }

  _getNextExecutionDate(rec) {
    const now = new Date();
    const next = new Date();

    switch (rec.frequency) {
      case 'daily':
        next.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        const targetDay = new Date(rec.startDate).getDay();
        const diff = (targetDay - now.getDay() + 7) % 7 || 7;
        next.setDate(now.getDate() + diff);
        break;
      case 'monthly':
        next.setDate(rec.dayOfMonth);
        if (next <= now) next.setMonth(next.getMonth() + 1);
        break;
      case 'yearly':
        const sd = new Date(rec.startDate);
        next.setMonth(sd.getMonth());
        next.setDate(sd.getDate());
        if (next <= now) next.setFullYear(next.getFullYear() + 1);
        break;
    }

    return next.toISOString().split('T')[0];
  }

  _getFrequencyLabel(freq) {
    const map = { daily: 'Harian', weekly: 'Mingguan', monthly: 'Bulanan', yearly: 'Tahunan' };
    return map[freq] || freq;
  }
}

const recurringController = new RecurringController();
module.exports = recurringController;
