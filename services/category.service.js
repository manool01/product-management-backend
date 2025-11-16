const { Category } = require("../models");

class CategoryService {
    static async createCategory(name) {
        const category = await Category.create({ name });
        return { message: "Category created successfully", category };
    }

    static async getAllCategories() {
        const categories = await Category.findAll();
        return categories;
    }

    static async getCategories({ page = 1, limit = 10, sort = "asc", search = "" }) {
        const offset = (page - 1) * limit;

        const whereCondition = search
            ? { name: { [Op.iLike]: `%${search}%` } }
            : {};

        const { count, rows } = await Category.findAndCountAll({
            where: whereCondition,
            order: [["name", sort.toUpperCase()]],
            limit,
            offset
        });

        return { count, rows };
    }


    static async updateCategory(id, name) {
        const category = await Category.findByPk(id);
        if (!category) return { error: "Category not found" };

        category.name = name;
        await category.save();

        return { message: "Category updated successfully", category };
    }

    static async deleteCategory(id) {
        const category = await Category.findByPk(id);
        if (!category) return { error: "Category not found" };

        await category.destroy();
        return { message: "Category deleted successfully" };
    }
}

module.exports = CategoryService;
