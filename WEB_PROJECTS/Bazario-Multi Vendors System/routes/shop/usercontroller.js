const express = require("express");
const router = express.Router();
const User = require("../../models/usermodel");
let Product = require("../../models/productsmodel");
const mongoose = require("mongoose");
const Order =   require("../../models/ordermodel");


const sendMail = require('../../utils/mailer');

 
// GET Signup page
router.get("/customersignup", (req, res) => {
  res.render("customersignup");
});

// POST Signup


router.post("/customersignup", async (req, res) => {
  const { name, email, phone, address, password } = req.body;

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000);

  // Store data + otp in session
  req.session.pendingUser = { name, email, phone, address, password };
  req.session.otp = otp;

  // Send OTP via email
  await sendMail(
    email,
    "Your Bazario Signup OTP",
    `<h2>Hello ${name},</h2>
     <p>Your OTP for completing signup is: <strong>${otp}</strong></p>
     <p>This code will expire in 5 minutes.</p>
     <p>Regards, <br/>Bazario Team</p>`
  );

  // Redirect to OTP entry page
  return res.render("verify-otp");

});
router.get("/verify-otp",async(req,res)=>{
return res.render("verify-otp");
});
router.post("/verify-otp", async (req, res) => {
  const { otp } = req.body;

  if (!req.session.pendingUser || !req.session.otp) {
    return res.send("Session expired or invalid attempt.");
  }

  if (parseInt(otp) !== req.session.otp) {
    return res.send("Invalid OTP. Please try again.");
  }

  try {
    const { name, email, phone, address, password } = req.session.pendingUser;

    // Optional: Check for duplicates again
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.send("Email is already registered.");
    }

    // Save user
    const user = new User({ name, email, phone, address, password });
    await user.save();

    // Clear OTP + temp session
    delete req.session.pendingUser;
    delete req.session.otp;

    req.session.user = user;

    res.redirect("/customerlogin");
  } catch (err) {
    res.send("Signup failed: " + err.message);
  }
});



// GET Login page
router.get("/customerlogin", (req, res) => {
  res.render("customerlogin");
});

// POST Login
router.post("/customerlogin", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email, password }); // Note: use bcrypt in production
  if (!user) {
    // Re-render the login page with an error message
    return res.render("customerlogin", { message: "Login Failed: Invalid credentials" });
  }


  req.session.user = user;
  if (user.role === "admin") {
    return res.redirect("/admin/dashboard");
  }

  // ✅ Prioritize returning to /checkout if user was placing an order
  if (req.session.checkoutForm) {
    return res.redirect("/checkout");
  }

  // ✅ Else, redirect to the original protected route
  if (req.session.redirectTo) {
    const redirectPath = req.session.redirectTo;
    delete req.session.redirectTo;
    return res.redirect(redirectPath);
  }

  // ✅ Default fallback if no context
  return res.redirect("/myorders");
});


// Logout (optional)
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});



router.get("/checkout/resume", async (req, res) => {
  if (!req.session.user || !req.session.checkoutForm) {
    return res.redirect("/checkout");
  }

  try {
    const { name, email, phone, address, paymentMethod } = req.session.checkoutForm;
    const cart = req.cookies.cart;

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).send("Cart is empty or invalid.");
    }

    let totalAmount = 0;
    const shopOrdersMap = {};

    for (const item of cart) {
      if (!mongoose.Types.ObjectId.isValid(item.id)) continue;

      const product = await Product.findById(item.id);
      if (!product) continue;

      const quantity = item.quantity || 1;
      const price = product.price;
      const shopId = product.shopId.toString();

      if (!shopOrdersMap[shopId]) {
        shopOrdersMap[shopId] = { products: [], total: 0 };
      }

      shopOrdersMap[shopId].products.push({
        productId: product._id,
        quantity,
        price
      });

      shopOrdersMap[shopId].total += price * quantity;
    }

    const orderPromises = [];

    for (const shopId in shopOrdersMap) {
      const { products, total } = shopOrdersMap[shopId];

      const newOrder = new Order({
        customer: { name, email, phone, address },
        products,
        totalAmount: total,
        paymentMethod,
        shopId
      });

      orderPromises.push(newOrder.save());
    }

    await Promise.all(orderPromises);

    // Clean up
    res.clearCookie("cart");
    delete req.session.checkoutForm;

    return res.redirect("/order-success");

  } catch (error) {
    console.error("Resume Checkout Error:", error);
    return res.status(500).send("An error occurred during resumed checkout.");
  }
});


module.exports = router;
