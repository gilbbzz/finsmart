const BaseController = require('./BaseController');
const Goal = require('../models/Goal');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');

class GoalController extends BaseController {
  constructor() {
    super(Goal);
  }

  
  async getAll(req, res) {
    try {
      const goals = await Goal.find({ user: req.user._id })
        .sort({ deadline: 1 })
        .lean({ virtuals: true });

      return this.sendSuccess(res, goals);
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async create(req, res) {
    try {
      const { title, icon, targetAmount, deadline } = req.body;

      if (!title || !targetAmount || !deadline) {
        return this.sendError(res, 'Judul, target, dan deadline wajib diisi');
      }

      const goal = await Goal.create({
        user: req.user._id,
        title,
        icon: icon || '🎯',
        targetAmount: Number(targetAmount),
        deadline: new Date(deadline)
      });

      return this.sendSuccess(res, goal.toJSON(), 'Target tabungan berhasil dibuat', 201);

    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async topup(req, res) {
    try {
      const { amount } = req.body;
      const topupAmount = Number(amount);

      if (!amount || topupAmount <= 0) {
        return this.sendError(res, 'Nominal topup tidak valid');
      }

      const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
      if (!goal) return this.sendError(res, 'Target tidak ditemukan', 404);

      
      if (goal.isClaimed) {
        return this.sendError(res, 'Target ini sudah diklaim. Tidak bisa topup lagi.');
      }

      
      if (goal.isCompleted) {
        return this.sendError(res, 'Target sudah tercapai! Silakan klaim hadiahmu.');
      }

      
      if (topupAmount > goal.targetAmount) {
        return this.sendError(res, `Nominal topup tidak boleh melebihi target tabungan (${goal.targetAmount.toLocaleString('id-ID')})`);
      }

      
      const remaining = goal.targetAmount - goal.savedAmount;
      if (topupAmount > remaining) {
        return this.sendError(res, `Nominal topup tidak boleh melebihi sisa tabungan yang dibutuhkan (${remaining.toLocaleString('id-ID')})`);
      }

      goal.savedAmount += topupAmount;

      
      if (goal.savedAmount >= goal.targetAmount) {
        goal.isCompleted = true;
      }

      await goal.save();

      return this.sendSuccess(res, goal.toJSON(), 'Tabungan berhasil ditambahkan');

    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async claim(req, res) {
    try {
      const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
      if (!goal) return this.sendError(res, 'Target tidak ditemukan', 404);

      if (!goal.isCompleted) {
        return this.sendError(res, 'Target belum tercapai, belum bisa diklaim.');
      }

      if (goal.isClaimed) {
        return this.sendError(res, 'Target ini sudah pernah diklaim sebelumnya.');
      }

      
      let category = await Category.findOne({ user: req.user._id, name: 'Target Tabungan', type: { $in: ['income', 'both'] } });
      if (!category) {
        category = await Category.create({
          user: req.user._id,
          name: 'Target Tabungan',
          icon: '🏆',
          color: '#22c55e',
          type: 'income',
          isDefault: false
        });
      }

      
      const transaction = await Transaction.create({
        user: req.user._id,
        type: 'income',
        amount: goal.savedAmount,
        category: category._id,
        note: `Target Tabungan "${goal.title}"`,
        date: new Date()
      });

      const populated = await transaction.populate({ path: 'category', select: 'name icon color' });

      
      goal.isClaimed = true;
      await goal.save();

      return this.sendSuccess(res, {
        goal: goal.toJSON(),
        transaction: populated
      }, `Selamat! ${formatRupiah(goal.savedAmount)} berhasil diklaim ke pendapatan 🎉`);

    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async update(req, res) {
    try {
      const { title, icon, targetAmount, deadline } = req.body;

      const goal = await Goal.findOne({ _id: req.params.id, user: req.user._id });
      if (!goal) return this.sendError(res, 'Target tidak ditemukan', 404);

      if (title)        goal.title        = title;
      if (icon)         goal.icon         = icon;
      if (targetAmount) goal.targetAmount = Number(targetAmount);
      if (deadline)     goal.deadline     = new Date(deadline);

      await goal.save();
      return this.sendSuccess(res, goal.toJSON(), 'Target berhasil diperbarui');

    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async delete(req, res) {
    try {
      const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
      if (!goal) return this.sendError(res, 'Target tidak ditemukan', 404);
      return this.sendSuccess(res, null, 'Target berhasil dihapus');
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }
}


function formatRupiah(n) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
}

const goalController = new GoalController();
module.exports = goalController;
