const CategoryService = require("../services/category.service");

exports.create = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Category name is required" });

  const result = await CategoryService.createCategory(name);
  res.json(result);
};

exports.getAll = async (req, res) => {
  const result = await CategoryService.getAllCategories();
  res.json(result);
};

exports.list = async (req, res, next) => {
  try {
    const { page, limit, sort, search } = req.query;

    const result = await CategoryService.getCategories({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      sort: sort || "asc",
      search: search || ""
    });

    res.json({
      total: result.count,
      page: Number(page) || 1,
      limit: Number(limit) || 10,
      categories: result.rows
    });
  } catch (err) {
    next(err);
  }
};


exports.update = async (req, res) => {
  const { name } = req.body;
  const { id } = req.params;

  const result = await CategoryService.updateCategory(id, name);
  if (result.error) return res.status(404).json({ error: result.error });

  res.json(result);
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  const result = await CategoryService.deleteCategory(id);
  if (result.error) return res.status(404).json({ error: result.error });

  res.json(result);
};
