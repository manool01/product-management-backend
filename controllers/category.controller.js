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
