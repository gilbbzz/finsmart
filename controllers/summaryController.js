const BaseController = require('./BaseController');
const Transaction    = require('../models/Transaction');

class SummaryController extends BaseController {
  constructor() {
    super(Transaction);
  }

  
  async getMonthly(req, res) {
    try {
      const month = req.query.month || this.getCurrentMonth();
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate   = new Date(year, monthNum, 0, 23, 59, 59);

      const totals = await Transaction.aggregate([
        { $match: { user: req.user._id, date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]);

      const income  = totals.find(t => t._id === 'income')  || { total: 0, count: 0 };
      const expense = totals.find(t => t._id === 'expense') || { total: 0, count: 0 };

      const topTransactions = await Transaction.find({
        user: req.user._id,
        date: { $gte: startDate, $lte: endDate }
      })
        .populate('category', 'name icon color')
        .sort({ amount: -1 })
        .limit(5)
        .lean();

      const byCategory = await Transaction.aggregate([
        { $match: { user: req.user._id, type: 'expense', date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
        { $limit: 6 }
      ]);

      const Category = require('../models/Category');
      const categoryIds = byCategory.map(b => b._id);
      const categories  = await Category.find({ _id: { $in: categoryIds } }).lean();
      const catMap = {};
      categories.forEach(c => { catMap[c._id.toString()] = c; });

      const categoryData = byCategory.map(b => ({
        category: catMap[b._id.toString()] || { name: 'Lainnya', icon: '📦', color: '#9ca3af' },
        total: b.total
      }));

      return this.sendSuccess(res, {
        month,
        income:  { total: income.total,  count: income.count  },
        expense: { total: expense.total, count: expense.count },
        balance: income.total - expense.total,
        topTransactions,
        categoryData
      });
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async getChartData(req, res) {
    try {
      const months = Math.min(Math.max(parseInt(req.query.months) || 6, 1), 24); 
      const result = [];

      for (let i = months - 1; i >= 0; i--) {
        const d        = new Date();
        d.setMonth(d.getMonth() - i);
        const year     = d.getFullYear();
        const monthNum = d.getMonth() + 1;
        const start    = new Date(year, monthNum - 1, 1);
        const end      = new Date(year, monthNum, 0, 23, 59, 59);
        const label    = `${String(monthNum).padStart(2,'0')}/${year}`;

        const totals = await Transaction.aggregate([
          { $match: { user: req.user._id, date: { $gte: start, $lte: end } } },
          { $group: { _id: '$type', total: { $sum: '$amount' } } }
        ]);

        const inc = totals.find(t => t._id === 'income')  || { total: 0 };
        const exp = totals.find(t => t._id === 'expense') || { total: 0 };
        result.push({ label, income: inc.total, expense: exp.total });
      }

      return this.sendSuccess(res, result);
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  
  async renderDashboard(req, res) {
    try {
      const month = this.getCurrentMonth();
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate   = new Date(year, monthNum, 0, 23, 59, 59);

      const totals = await Transaction.aggregate([
        { $match: { user: req.user._id, date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$type', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ]);

      const income  = totals.find(t => t._id === 'income')  || { total: 0, count: 0 };
      const expense = totals.find(t => t._id === 'expense') || { total: 0, count: 0 };

      const topTransactions = await Transaction.find({
        user: req.user._id,
        date: { $gte: startDate, $lte: endDate }
      })
        .populate('category', 'name icon color')
        .sort({ amount: -1 })
        .limit(5)
        .lean();

      const byCategory = await Transaction.aggregate([
        { $match: { user: req.user._id, type: 'expense', date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
        { $limit: 6 }
      ]);

      const Category = require('../models/Category');
      const catDocs  = await Category.find({ _id: { $in: byCategory.map(b => b._id) } }).lean();
      const catMap   = {};
      catDocs.forEach(c => { catMap[c._id.toString()] = c; });

      const categoryData = byCategory.map(b => ({
        category: catMap[b._id.toString()] || { name: 'Lainnya', icon: '📦' },
        total: b.total
      }));

      res.render('dashboard/index', {
        title:   'Dashboard',
        user:    req.user,
        month,
        summary: {
          income:  { total: income.total,  count: income.count },
          expense: { total: expense.total, count: expense.count },
          topTransactions,
          categoryData
        },
        formatRupiah: this.formatRupiah.bind(this)
      });
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }
}

const summaryController = new SummaryController();
module.exports = summaryController;
