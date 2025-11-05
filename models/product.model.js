const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Product = sequelize.define("Product", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING, 
    allowNull: true
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  uniqueId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    unique: true,
  }
}, {
  tableName: "products",
  timestamps: true
});

module.exports = Product;
