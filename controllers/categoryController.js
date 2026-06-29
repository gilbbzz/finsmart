const BaseController = require('./BaseController');
const Category = require('../models/Category');

class CategoryController extends BaseController {
  constructor() {
    super(Category);
  }

  
  async getAll(req, res) {
    try {
      
      const categories = await Category.find({ user: req.user._id }).sort({ name: 1 }).lean();
      return this.sendSuccess(res, categories);
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async create(req, res) {
    try {
      const { name, icon, color, type } = req.body;
      if (!name) return this.sendError(res, 'Nama kategori wajib diisi');

      
      const category = await Category.create({ user: req.user._id, name, icon, color, type });
      return this.sendSuccess(res, category, 'Kategori berhasil ditambahkan', 201);
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }

  
  async delete(req, res) {
    try {
      
      const category = await Category.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id
      });
      if (!category) return this.sendError(res, 'Kategori tidak ditemukan', 404);
      return this.sendSuccess(res, null, 'Kategori berhasil dihapus');
    } catch (error) {
      return this.sendError(res, error.message, 500);
    }
  }
}

const categoryController = new CategoryController();
module.exports = categoryController;
