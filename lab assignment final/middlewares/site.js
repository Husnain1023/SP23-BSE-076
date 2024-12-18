let User = require("../models/usermodel");


module.exports = async function (req, res, next) {
  res.locals.user = req.session.user;
  req.user = req.session.user;
  next();
};
