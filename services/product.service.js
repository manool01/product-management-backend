const { Product, Category } = require("../models");
const { Op } = require("sequelize");
const { productRowSchema } = require("../validators/product.validator");

const chunk = (arr, size) =>
    Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, i * size + size)
    );


class ProductService {
    static async createProduct({ name, price, categoryId, image }) {
        const category = await Category.findByPk(categoryId);
        if (!category) return { error: "Category not found" };

        const product = await Product.create({
            name,
            price,
            image,
            categoryId: categoryId
        });

        return { message: "Product created successfully", product };
    }

    static async getAllProducts() {
        return await Product.findAll({
            include: [{ model: Category, attributes: ["name", "uniqueId"] }]
        });
    }

    static async updateProduct(id, data) {
        const product = await Product.findByPk(id);
        if (!product) return { error: "Product not found" };

        await product.update(data);
        return { message: "Product updated successfully", product };
    }

    static async deleteProduct(id) {
        const product = await Product.findByPk(id);
        if (!product) return { error: "Product not found" };

        await product.destroy();
        return { message: "Product deleted successfully" };
    }

    static async getProducts({ page = 1, limit = 10, sort = "asc", search = "", category = "" }) {
        const offset = (page - 1) * limit;

        const whereCondition = search
            ? { name: { [Op.iLike]: `%${search}%` } }
            : {};

        const includeCondition = {
            model: Category,
            attributes: ["name", "uniqueId"],
            required: true
        };

        if (category.trim() !== "") {
            includeCondition.where = { name: { [Op.iLike]: `%${category}%` } };
        }

        return await Product.findAndCountAll({
            where: whereCondition,
            include: [includeCondition],
            order: [["price", sort.toUpperCase()]],
            limit,
            offset
        });
    }

    // static async bulkInsert(rows) {
    //     const categories = await Category.findAll({ attributes: ["id", "name"] });

    //     // Create a fast lookup map → lowercased to avoid case sensitivity issues
    //     const nameToId = new Map(
    //         categories.map(c => [c.name.toLowerCase(), c.id])
    //     );

    //     const valid = [];
    //     const invalid = [];

    //     for (const r of rows) {
    //         const row = {
    //             name: String(r.name || "").trim(),
    //             price: Number(r.price),
    //             image: r.image || null,
    //             categoryName: r.categoryName ? String(r.categoryName).trim() : "",
    //             categoryId: null // will set below
    //         };

    //         // ✅ Map categoryName → CategoryId
    //         if (row.categoryName) {
    //             row.categoryId = nameToId.get(row.categoryName.toLowerCase()) || null;
    //         }

    //         // Validate using Joi
    //         const { error } = productRowSchema.validate(row);
    //         if (error) {
    //             invalid.push({ row, reason: error.details[0].message });
    //             continue;
    //         }

    //         // If category doesn’t exist → skip row
    //         if (!row.categoryId) {
    //             invalid.push({ row, reason: "Category does not exist" });
    //             continue;
    //         }

    //         valid.push({
    //             name: row.name,
    //             price: row.price,
    //             image: row.image,
    //             CategoryId: row.categoryId
    //         });
    //     }

    //     // ✅ Insert in batches to avoid 504 timeout
    //     const batchSize = 2000;
    //     for (let i = 0; i < valid.length; i += batchSize) {
    //         await Product.bulkCreate(valid.slice(i, i + batchSize), { validate: true });
    //     }

    //     return {
    //         inserted: valid.length,
    //         skipped: invalid.length,
    //         skippedExamples: invalid.slice(0, 10)
    //     };
    // }

    static async bulkInsert(rows) {
        const categories = await Category.findAll({ attributes: ["id", "name"] });
        const nameToId = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));

        const valid = [];
        const invalid = [];

        for (const r of rows) {
            // Clean base row
            const row = {
                name: String(r.name || "").trim(),
                price: Number(r.price),
                categoryName: r.categoryName ? String(r.categoryName).trim() : "",
                image: r.image || null
            };

            // ✅ Validate BEFORE mapping
            const { error } = productRowSchema.validate(row);
            if (error) {
                invalid.push({ row, reason: error.details[0].message });
                continue;
            }

            // ✅ Now map categoryName → CategoryId
            const categoryId = nameToId.get(row.categoryName.toLowerCase());
            if (!categoryId) {
                invalid.push({ row, reason: "Category does not exist" });
                continue;
            }

            // Final DB insert format:
            valid.push({
                name: row.name,
                price: row.price,
                image: row.image,
                CategoryId: categoryId
            });
        }

        // ✅ Insert in chunks to avoid timeout
        const batchSize = 2000;
        for (let i = 0; i < valid.length; i += batchSize) {
            await Product.bulkCreate(valid.slice(i, i + batchSize), { validate: true });
        }

        return {
            inserted: valid.length,
            skipped: invalid.length,
            skippedExamples: invalid.slice(0, 10)
        };
    }

}

module.exports = ProductService;
