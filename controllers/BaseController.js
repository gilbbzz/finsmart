class BaseController {
  constructor(model) {
    this.model = model;
  }

  
  sendSuccess(res, data, message = 'Berhasil', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  
  sendError(res, message = 'Terjadi kesalahan', statusCode = 400) {
    return res.status(statusCode).json({
      success: false,
      message
    });
  }

  
  formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  }

  
  getCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }
}

module.exports = BaseController;
