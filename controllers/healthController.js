const BaseController = require('./BaseController');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const Investment = require('../models/Investment');
const Debt = require('../models/Debt');

class HealthController extends BaseController {
  constructor() {
    super(Transaction); 
  }

  
  async getScore(req, res) {
    try {
      const userId = req.user._id;
      const now    = new Date();

      
      const month    = req.query.month || this.getCurrentMonth();
      const [yr, mn] = month.split('-').map(Number);
      const startDate = new Date(yr, mn - 1, 1);
      const endDate   = new Date(yr, mn, 0, 23, 59, 59);

      const totals = await Transaction.aggregate([
        { $match: { user: userId, date: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$type', total: { $sum: '$amount' } } }
      ]);

      const income  = (totals.find(t => t._id === 'income')  || { total: 0 }).total;
      const expense = (totals.find(t => t._id === 'expense') || { total: 0 }).total;

      
      const budgets = await Budget.find({ user: userId, month }).lean();

      const spending = await Transaction.aggregate([
        {
          $match: {
            user: userId,
            type: 'expense',
            date: { $gte: startDate, $lte: endDate }
          }
        },
        { $group: { _id: '$category', totalSpent: { $sum: '$amount' } } }
      ]);
      const spendingMap = {};
      spending.forEach(s => { spendingMap[s._id.toString()] = s.totalSpent; });

      const overBudgetCount = budgets.filter(b => {
        const spent = spendingMap[b.category.toString()] || 0;
        return spent > b.limitAmount;
      }).length;

      
      const goals        = await Goal.find({ user: userId }).lean({ virtuals: true });
      const activeGoals  = goals.filter(g => !g.isClaimed);
      const onTrackGoals = activeGoals.filter(g => {
        if (g.isCompleted) return true;
        const daysLeft  = Math.max((new Date(g.deadline) - now) / (1000 * 60 * 60 * 24), 0);
        const progress  = g.savedAmount / g.targetAmount;
        const timeRatio = 1 - daysLeft / Math.max((new Date(g.deadline) - new Date(g.createdAt)) / (1000 * 60 * 60 * 24), 1);
        return progress >= timeRatio * 0.8; 
      });

      
      const investments      = await Investment.find({ user: userId, isActive: true }).lean({ virtuals: true });
      const totalPrincipal   = investments.reduce((s, i) => s + i.principalAmount, 0);
      const totalCurrValue   = investments.reduce((s, i) => s + i.currentValue, 0);

      
      const debts            = await Debt.find({ user: userId, isPaid: false, type: 'debt' }).lean({ virtuals: true });
      const totalDebt        = debts.reduce((s, d) => s + (d.amount - d.paidAmount), 0);
      const overdueDebts     = debts.filter(d => d.dueDate && new Date(d.dueDate) < now).length;

      

      
      let savingsScore = 0;
      if (income > 0) {
        const savingsRate = (income - expense) / income;
        if (savingsRate >= 0.3)      savingsScore = 20;
        else if (savingsRate >= 0.2) savingsScore = 16;
        else if (savingsRate >= 0.1) savingsScore = 12;
        else if (savingsRate >= 0)   savingsScore = 8;
        else                         savingsScore = 0; 
      } else {
        savingsScore = income === 0 && expense === 0 ? 10 : 0;
      }

      
      let budgetScore = 20;
      if (budgets.length > 0) {
        const budgetRate = overBudgetCount / budgets.length;
        budgetScore = Math.round((1 - budgetRate) * 20);
      }

      
      let goalsScore = 10; 
      if (activeGoals.length > 0) {
        const onTrackRate = onTrackGoals.length / activeGoals.length;
        goalsScore = Math.round(onTrackRate * 20);
      }

      
      let investScore = 0;
      if (investments.length === 0) {
        investScore = 5; 
      } else {
        const hasPositiveReturn = totalCurrValue >= totalPrincipal;
        const instrumentTypes = [...new Set(investments.map(i => i.instrumentType))].length;
        investScore = hasPositiveReturn ? 12 : 6;
        if (instrumentTypes >= 3) investScore += 8; 
        else if (instrumentTypes >= 2) investScore += 5;
        else investScore += 2;
        investScore = Math.min(investScore, 20);
      }

      
      let debtScore = 20;
      if (income > 0 && totalDebt > 0) {
        const debtRatio = totalDebt / income;
        if (debtRatio > 3)      debtScore = 4;
        else if (debtRatio > 2) debtScore = 8;
        else if (debtRatio > 1) debtScore = 12;
        else                    debtScore = 16;
      }
      if (overdueDebts > 0) debtScore = Math.max(debtScore - 5, 0);

      const totalScore = savingsScore + budgetScore + goalsScore + investScore + debtScore;

      
      const { grade, gradeColor, gradeEmoji } = this._getGrade(totalScore);
      const recommendations = this._getRecommendations({
        savingsScore, budgetScore, goalsScore, investScore, debtScore,
        income, expense, overBudgetCount, overdueDebts,
        hasInvestments: investments.length > 0,
        hasGoals: activeGoals.length > 0,
        totalDebt
      });

      return this.sendSuccess(res, {
        month,
        totalScore,
        grade,
        gradeColor,
        gradeEmoji,
        components: {
          savings:  { score: savingsScore,  maxScore: 20, label: 'Rasio Tabungan',       detail: income > 0 ? `${Math.round(((income - expense) / income) * 100)}% dari pemasukan ditabung` : 'Belum ada data pemasukan' },
          budget:   { score: budgetScore,   maxScore: 20, label: 'Ketaatan Budget',      detail: budgets.length > 0 ? `${overBudgetCount} dari ${budgets.length} kategori melewati budget` : 'Belum ada budget diset' },
          goals:    { score: goalsScore,    maxScore: 20, label: 'Target Tabungan',      detail: activeGoals.length > 0 ? `${onTrackGoals.length} dari ${activeGoals.length} target on track` : 'Belum ada target tabungan' },
          invest:   { score: investScore,   maxScore: 20, label: 'Portofolio Investasi', detail: investments.length > 0 ? `${investments.length} instrumen, return ${totalPrincipal > 0 ? ((totalCurrValue - totalPrincipal) / totalPrincipal * 100).toFixed(1) : 0}%` : 'Belum ada investasi' },
          debt:     { score: debtScore,     maxScore: 20, label: 'Manajemen Hutang',     detail: totalDebt > 0 ? `Hutang aktif ${this.formatRupiah(totalDebt)}${overdueDebts > 0 ? `, ${overdueDebts} jatuh tempo` : ''}` : 'Tidak ada hutang aktif 👍' }
        },
        recommendations,
        analyzedAt: new Date().toISOString()
      });

    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  

  _getGrade(score) {
    if (score >= 85) return { grade: 'A',  gradeColor: '#22c55e', gradeEmoji: '🏆' };
    if (score >= 70) return { grade: 'B',  gradeColor: '#84cc16', gradeEmoji: '👍' };
    if (score >= 55) return { grade: 'C',  gradeColor: '#eab308', gradeEmoji: '📊' };
    if (score >= 40) return { grade: 'D',  gradeColor: '#f97316', gradeEmoji: '⚠️' };
    return                  { grade: 'E',  gradeColor: '#ef4444', gradeEmoji: '🚨' };
  }

  _getRecommendations({ savingsScore, budgetScore, goalsScore, investScore, debtScore,
    income, expense, overBudgetCount, overdueDebts, hasInvestments, hasGoals, totalDebt }) {
    const recs = [];

    if (savingsScore < 12) {
      recs.push({
        icon: '💡',
        priority: 'high',
        title: 'Tingkatkan Rasio Tabungan',
        detail: income > expense
          ? 'Coba ikuti aturan 50/30/20: 50% kebutuhan, 30% keinginan, 20% tabungan.'
          : 'Pengeluaran melebihi pemasukan! Segera cari sumber pendapatan tambahan atau potong pengeluaran tidak penting.'
      });
    }

    if (budgetScore < 12 && overBudgetCount > 0) {
      recs.push({
        icon: '🎯',
        priority: 'high',
        title: 'Patuhi Batas Budget',
        detail: `${overBudgetCount} kategori melampaui budget bulan ini. Review dan sesuaikan kebiasaan pengeluaran kamu.`
      });
    }

    if (!hasGoals) {
      recs.push({
        icon: '⭐',
        priority: 'medium',
        title: 'Buat Target Keuangan',
        detail: 'Mulai buat target tabungan spesifik (dana darurat, liburan, dll) agar keuanganmu lebih terarah.'
      });
    } else if (goalsScore < 12) {
      recs.push({
        icon: '⏰',
        priority: 'medium',
        title: 'Percepat Progress Target',
        detail: 'Beberapa target tabungan kamu tertinggal dari jadwal. Tambah topup rutin agar bisa tepat waktu.'
      });
    }

    if (!hasInvestments) {
      recs.push({
        icon: '📈',
        priority: 'medium',
        title: 'Mulai Berinvestasi',
        detail: 'Uang yang idle tidak akan bertumbuh. Pertimbangkan reksa dana pasar uang sebagai langkah investasi pertama yang aman.'
      });
    } else if (investScore < 12) {
      recs.push({
        icon: '🔀',
        priority: 'low',
        title: 'Diversifikasi Portofolio',
        detail: 'Jangan taruh semua telur dalam satu keranjang. Pertimbangkan diversifikasi ke lebih dari 2 jenis instrumen investasi.'
      });
    }

    if (overdueDebts > 0) {
      recs.push({
        icon: '🚨',
        priority: 'high',
        title: 'Lunasi Hutang Jatuh Tempo',
        detail: `${overdueDebts} hutang sudah melewati jatuh tempo. Prioritaskan pelunasan untuk menghindari denda/bunga.`
      });
    } else if (totalDebt > 0 && debtScore < 12) {
      recs.push({
        icon: '💸',
        priority: 'medium',
        title: 'Kurangi Beban Hutang',
        detail: 'Rasio hutang terhadap pendapatan cukup tinggi. Gunakan metode avalanche (lunasi hutang bunga tertinggi dulu).'
      });
    }

    if (recs.length === 0) {
      recs.push({
        icon: '🎉',
        priority: 'low',
        title: 'Keuangan Kamu Sehat!',
        detail: 'Pertahankan kebiasaan finansial yang baik. Tingkatkan terus nilai investasi dan diversifikasi portofolio.'
      });
    }

    return recs;
  }
}

const healthController = new HealthController();
module.exports = healthController;
