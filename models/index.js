
const sequelize = require("../config/db");
const User = require("./user.model");
const Category = require("./category.model");
const Product = require("./product.model");

// Relationships
Category.hasMany(Product, { foreignKey: "CategoryId", onDelete: "CASCADE" });
Product.belongsTo(Category, { foreignKey: "CategoryId" });


module.exports = {
  sequelize,
  User,
  Category,
  Product
};