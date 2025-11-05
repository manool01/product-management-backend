const express = require("express");
const router = express.Router();
const ProductController = require("../controllers/product.controller");
const upload = require("../utils/upload");
const { productCreateSchema,productListQuerySchema } = require("../validators/product.validator");
const validateQuery = require("../middleware/validateQuery.middleware");


router.post("/", upload.single("image"), (req, res, next) => {
    const { error } = productCreateSchema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message.replace(/"/g, "") });
    }
    next();
}, ProductController.create);

router.get("/", ProductController.getAll);
router.put("/:id", ProductController.update);
router.delete("/:id", ProductController.delete);
router.get("/list", validateQuery(productListQuerySchema), ProductController.list);

router.post("/bulk-upload", upload.single("file"), ProductController.bulkUpload);

router.get("/export/csv", ProductController.exportCSV);
router.get("/export/excel", ProductController.exportExcel);
router.get("/dashboard-summary", ProductController.dashboardSummary);


module.exports = router;