const BaseController = require('./BaseController');
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

class BudgetController extends BaseController {
  constructor() {
    super(Budget);
  }

  
  async getAll(req, res) {
    try {
      const month = req.query.month || this.getCurrentMonth();

      const budgets = await Budget.find({ user: req.user._id, month })
        .populate('category', 'name icon color')
        .lean();

      
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate   = new Date(year, monthNum, 0, 23, 59, 59);

      const spending = await Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            type: 'expense',
            date: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: '$category',
            totalSpent: { $sum: '$amount' }
          }
        }
      ]);

      
      const spendingMap = {};
      spending.forEach(s => { spendingMap[s._id.toString()] = s.totalSpent; });

      const result = budgets.map(b => {
        const spent   = spendingMap[b.category._id.toString()] || 0;
        const percent = Math.round((spent / b.limitAmount) * 100);
        return {
          ...b,
          spent,
          remaining: Math.max(b.limitAmount - spent, 0),
          percentUsed: percent,
          isOverBudget: spent > b.limitAmount
        };
      });

      return this.sendSuccess(res, result);

    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async create(req, res) {
    try {
      const { category, limitAmount, month } = req.body;

      if (!category || !limitAmount) {
        return this.sendError(res, 'Kategori dan limit wajib diisi');
      }

      const targetMonth = month || this.getCurrentMonth();

      
      const budget = await Budget.findOneAndUpdate(
        { user: req.user._id, category, month: targetMonth },
        { limitAmount: Number(limitAmount) },
        { new: true, upsert: true }
      ).populate('category', 'name icon color');

      return this.sendSuccess(res, budget, 'Budget berhasil disimpan', 201);

    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async update(req, res) {
    try {
      const budget = await Budget.findOneAndUpdate(
        { _id: req.params.id, user: req.user._id },
        { limitAmount: Number(req.body.limitAmount) },
        { new: true }
      ).populate('category', 'name icon color');

      if (!budget) return this.sendError(res, 'Budget tidak ditemukan', 404);

      return this.sendSuccess(res, budget, 'Budget berhasil diperbarui');

    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async getAlerts(req, res) {
    try {
      const month = this.getCurrentMonth();
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate   = new Date(year, monthNum, 0, 23, 59, 59);

      const budgets = await Budget.find({ user: req.user._id, month })
        .populate('category', 'name icon color')
        .lean();

      const spending = await Transaction.aggregate([
        {
          $match: {
            user: req.user._id,
            type: 'expense',
            date: { $gte: startDate, $lte: endDate }
          }
        },
        { $group: { _id: '$category', totalSpent: { $sum: '$amount' } } }
      ]);

      const spendingMap = {};
      spending.forEach(s => { spendingMap[s._id.toString()] = s.totalSpent; });

      const alerts = [];

      budgets.forEach(b => {
        const spent   = spendingMap[b.category._id.toString()] || 0;
        const percent = (spent / b.limitAmount) * 100;

        if (percent >= 100) {
          alerts.push({
            type: 'danger',
            category: b.category,
            message: `Budget ${b.category.name} sudah terlampaui!`,
            percentUsed: Math.round(percent)
          });
        } else if (percent >= 80) {
          alerts.push({
            type: 'warning',
            category: b.category,
            message: `Budget ${b.category.name} hampir habis (${Math.round(percent)}%)`,
            percentUsed: Math.round(percent)
          });
        }
      });

      
      res.setHeader('Content-Type', 'application/json');
      return this.sendSuccess(res, alerts);

    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  async delete(req, res) {
    try {
      const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
      if (!budget) return this.sendError(res, 'Budget tidak ditemukan', 404);
      return this.sendSuccess(res, null, 'Budget berhasil dihapus');
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }
}

const budgetController = new BudgetController();
module.exports = budgetController;
