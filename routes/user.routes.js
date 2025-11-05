const express = require("express");
const router = express.Router();
const UserController = require("../controllers/user.controller");
const validate = require("../middleware/validate.middleware");
const { registerSchema, loginSchema } = require("../validators/user.validator");

router.post("/register", validate(registerSchema), UserController.register);
router.post("/login", validate(loginSchema), UserController.login);

module.exports = router;