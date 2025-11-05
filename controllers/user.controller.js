const UserService = require("../services/user.service");

exports.register = async (req, res) => {
  const result = await UserService.register(req.body);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
};

exports.login = async (req, res) => {
  const result = await UserService.login(req.body);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result);
};
