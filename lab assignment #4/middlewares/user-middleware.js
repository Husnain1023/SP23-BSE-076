module.exports = async function (req, res, next) {
    if (!req.session.user?.role.includes("user")) return res.redirect("/login");
    else next();
  };