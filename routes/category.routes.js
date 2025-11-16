const express = require("express");
const router = express.Router();
const CategoryController = require("../controllers/category.controller");
const validate = require("../middleware/validate.middleware");
const { categorySchema } = require("../validators/category.validator");

router.post("/", validate(categorySchema), CategoryController.create);
router.put("/:id", validate(categorySchema), CategoryController.update);
router.get("/", CategoryController.getAll);
router.get("/list", CategoryController.list);
router.delete("/:id", CategoryController.delete);

module.exports = router;