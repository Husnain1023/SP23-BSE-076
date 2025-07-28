// middleware/checkUser.js
module.exports = (req, res, next) => {
  if (!req.session.user) {
    // Save checkout form data into session so it's not lost
    req.session.checkoutForm = req.body;

    // Redirect to login page
    return res.redirect("/customerlogin");
  }

  // Logged in, continue
  next();
};
