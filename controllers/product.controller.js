const ProductService = require("../services/product.service");
const { Product, Category, sequelize } = require("../models");
const csv = require("csv-parser");
const ExcelJS = require("exceljs");
const fs = require("fs");
const { Op } = require("sequelize");

// exports.create = async (req, res) => {
//   const { name, price, categoryId } = req.body;
//   const image = req.file ? req.file.filename : null;

//   const result = await ProductService.createProduct({ name, price, categoryId, image });
//   if (result.error) return res.status(400).json({ error: result.error });

//   res.json(result);
// };

exports.getAll = async (req, res) => {
  const products = await ProductService.getAllProducts();
  res.json(products);
};

// exports.update = async (req, res) => {
//   const { id } = req.params;
//   const result = await ProductService.updateProduct(id, req.body);
//   if (result.error) return res.status(404).json({ error: result.error });

//   res.json(result);
// };

exports.delete = async (req, res) => {
  const { id } = req.params;
  const result = await ProductService.deleteProduct(id);
  if (result.error) return res.status(404).json({ error: result.error });

  res.json(result);
};

exports.list = async (req, res) => {
  const { page, limit, sort, search, category } = req.query;

  const result = await ProductService.getProducts({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 10,
    sort: sort || "asc",
    search: search || "",
    category: category || ""
  });

  console.log(result);

  res.json({
    total: result.count,
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    products: result.rows
  });
};


exports.bulkUpload = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "File is required" });

  const filePath = req.file.path;
  const results = [];

  try {
    if (req.file.originalname.endsWith(".csv")) {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", row => results.push(row))
        .on("end", async () => {
          const response = await ProductService.bulkInsert(results);
          fs.unlinkSync(filePath);
          res.json(response);
        });
    } else if (req.file.originalname.endsWith(".xlsx")) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const sheet = workbook.worksheets[0];

      // helper to read a cell as trimmed string safely
      const cellText = (cell) => {
        const v = cell?.text ?? cell?.result ?? cell?.value;
        if (v === null || v === undefined) return "";
        return String(v).trim();
      };

      // Expecting header order: name | price | categoryName | image
      // Row 1 is header
      sheet.eachRow((row, rowNum) => {
        if (rowNum === 1) return;

        const name = cellText(row.getCell(1));
        const priceRaw = row.getCell(2)?.value;           // may be number already
        const categoryName = cellText(row.getCell(3));        // <-- IMPORTANT: read categoryName, not id
        const image = cellText(row.getCell(4)) || null;

        results.push({
          name,
          price: Number(priceRaw),
          categoryName,   // <-- this will be mapped to CategoryId in the service
          image
        });
      });

      const response = await ProductService.bulkInsert(results);
      fs.unlinkSync(filePath);
      return res.json(response);
    } else {
      res.status(400).json({ error: "Only CSV or XLSX are supported" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Bulk upload failed" });
  }
};

exports.exportCSV = async (req, res) => {
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=products.csv");

  // Write CSV header
  res.write("name,price,category,image\n");

  // Stream rows in chunks to avoid RAM spike
  let offset = 0;
  const limit = 2000;

  while (true) {
    const products = await Product.findAll({
      include: [{ model: Category, attributes: ["name"] }],
      offset,
      limit
    });

    if (products.length === 0) break;

    for (const p of products) {
      res.write(
        `${p.name},${p.price},${p.Category?.name || ""},${p.image || ""}\n`
      );
    }

    offset += limit;
  }

  res.end();
};

exports.exportExcel = async (req, res) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Products");

  sheet.columns = [
    { header: "Name", key: "name" },
    { header: "Price", key: "price" },
    { header: "Category", key: "category" },
    { header: "Image", key: "image" },
  ];

  let offset = 0;
  const limit = 2000;

  while (true) {
    const products = await Product.findAll({
      include: [{ model: Category, attributes: ["name"] }],
      offset,
      limit
    });

    if (products.length === 0) break;

    for (const p of products) {
      sheet.addRow({
        name: p.name,
        price: p.price,
        category: p.Category?.name || "",
        image: p.image || ""
      });
    }

    offset += limit;
  }

  res.setHeader(
    "Content-Disposition",
    "attachment; filename=products.xlsx"
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  await workbook.xlsx.write(res);
  res.end();
};

exports.dashboardSummary = async (req, res, next) => {
  try {
    const totalProducts = await Product.count();
    const totalCategories = await Category.count();

    const highestProduct = await Product.findOne({
      order: [["price", "DESC"]],
      include: { model: Category, attributes: ["name"] }
    });

    const lowestProduct = await Product.findOne({
      order: [["price", "ASC"]],
      include: { model: Category, attributes: ["name"] }
    });

    const avgPriceData = await Product.findOne({
      attributes: [[sequelize.fn("AVG", sequelize.col("price")), "avgPrice"]]
    });

    const avgPrice = Math.round(Number(avgPriceData?.get("avgPrice")) || 0);

    const categoryCounts = await Product.findAll({
      attributes: [
        "CategoryId",
        [sequelize.fn("COUNT", sequelize.col("Product.id")), "count"]
      ],
      group: ["CategoryId", "Category.id"],
      include: { model: Category, attributes: ["id", "name"] }
    });

    const totalValueData = await Product.findOne({
      attributes: [[sequelize.fn("SUM", sequelize.col("price")), "totalValue"]]
    });

    const totalInventoryValue = Math.round(Number(totalValueData?.get("totalValue")) || 0);

    return res.json({
      totalProducts,
      totalCategories,
      avgPrice,
      highestProduct,
      lowestProduct,
      categoryCounts,
      totalInventoryValue
    });

  } catch (error) {
    next(error);
  }
};


exports.create = async (req, res, next) => {
  try {
    const { name, price, categoryId } = req.body;
    let image = null;

    if (req.file) {
      image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    const product = await Product.create({
      name,
      price,
      CategoryId: categoryId,
      image
    });

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { name, price, categoryId } = req.body;
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found' });

    let fields = { name, price, CategoryId: categoryId };
    if (req.file) {
      fields.image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    await product.update(fields);
    res.json(product);
  } catch (err) {
    next(err);
  }
};
