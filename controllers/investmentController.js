const BaseController = require('./BaseController');
const Investment = require('../models/Investment');

class InvestmentController extends BaseController {
  constructor() {
    super(Investment);
  }

  
  async getAll(req, res) {
    try {
      const filter = { user: req.user._id };
      if (req.query.instrumentType) filter.instrumentType = req.query.instrumentType;
      if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true';

      const investments = await Investment.find(filter)
        .sort({ isActive: -1, principalAmount: -1 })
        .lean({ virtuals: true });

      
      const activeInvestments = investments.filter(i => i.isActive);
      const summary = {
        totalPrincipal: activeInvestments.reduce((s, i) => s + i.principalAmount, 0),
        totalCurrentValue: activeInvestments.reduce((s, i) => s + i.currentValue, 0),
        totalProfitLoss: activeInvestments.reduce((s, i) => s + (i.currentValue - i.principalAmount), 0),
        count: activeInvestments.length,
        
        byInstrument: this._groupByInstrument(activeInvestments)
      };
      summary.totalReturnPercent = summary.totalPrincipal > 0
        ? parseFloat(((summary.totalProfitLoss / summary.totalPrincipal) * 100).toFixed(2))
        : 0;

      return this.sendSuccess(res, { investments, summary });
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async create(req, res) {
    try {
      const { name, instrumentType, principalAmount, currentValue, startDate, ticker, notes } = req.body;

      if (!name || !instrumentType || principalAmount === undefined || currentValue === undefined || !startDate) {
        return this.sendError(res, 'Nama, jenis, modal, nilai saat ini, dan tanggal mulai wajib diisi');
      }

      const investment = await Investment.create({
        user: req.user._id,
        name: name.trim(),
        instrumentType,
        principalAmount: Number(principalAmount),
        currentValue: Number(currentValue),
        startDate: new Date(startDate),
        ticker: ticker ? ticker.trim().toUpperCase() : undefined,
        notes,
        valueHistory: [{ value: Number(currentValue), date: new Date(), note: 'Nilai awal' }]
      });

      return this.sendSuccess(res, investment.toJSON(), 'Investasi berhasil ditambahkan', 201);
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async update(req, res) {
    try {
      const investment = await Investment.findOne({ _id: req.params.id, user: req.user._id });
      if (!investment) return this.sendError(res, 'Data tidak ditemukan', 404);

      const { name, principalAmount, ticker, notes, isActive } = req.body;

      if (name !== undefined)            investment.name            = name.trim();
      if (principalAmount !== undefined) investment.principalAmount = Number(principalAmount);
      if (ticker !== undefined)          investment.ticker          = ticker ? ticker.trim().toUpperCase() : '';
      if (notes !== undefined)           investment.notes           = notes;
      if (isActive !== undefined)        investment.isActive        = isActive;

      await investment.save();
      return this.sendSuccess(res, investment.toJSON(), 'Investasi berhasil diperbarui');
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async delete(req, res) {
    try {
      const investment = await Investment.findOneAndDelete({ _id: req.params.id, user: req.user._id });
      if (!investment) return this.sendError(res, 'Data tidak ditemukan', 404);
      return this.sendSuccess(res, null, 'Investasi berhasil dihapus');
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async updateValue(req, res) {
    try {
      const { currentValue, note } = req.body;
      const newValue = Number(currentValue);

      if (currentValue === undefined || isNaN(newValue) || newValue < 0) {
        return this.sendError(res, 'Nilai investasi tidak valid');
      }

      const investment = await Investment.findOne({ _id: req.params.id, user: req.user._id });
      if (!investment) return this.sendError(res, 'Data tidak ditemukan', 404);

      const oldValue = investment.currentValue;
      investment.currentValue = newValue;

      
      investment.valueHistory.push({
        value: newValue,
        date: new Date(),
        note: note || `Update nilai dari ${this.formatRupiah(oldValue)}`
      });

      
      if (investment.valueHistory.length > 50) {
        investment.valueHistory = investment.valueHistory.slice(-50);
      }

      await investment.save();

      const diff = newValue - oldValue;
      const diffLabel = diff >= 0 ? `+${this.formatRupiah(diff)}` : this.formatRupiah(diff);
      return this.sendSuccess(res, investment.toJSON(), `Nilai diperbarui (${diffLabel})`);
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  

  _groupByInstrument(investments) {
    const map = {};
    investments.forEach(i => {
      if (!map[i.instrumentType]) {
        map[i.instrumentType] = { total: 0, currentValue: 0, count: 0 };
      }
      map[i.instrumentType].total        += i.principalAmount;
      map[i.instrumentType].currentValue += i.currentValue;
      map[i.instrumentType].count        += 1;
    });
    return map;
  }
}

const investmentController = new InvestmentController();
module.exports = investmentController;
