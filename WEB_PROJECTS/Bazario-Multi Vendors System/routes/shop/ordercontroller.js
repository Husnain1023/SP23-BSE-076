const express = require("express");
let routers = express.Router();

const Order =   require("../../models/ordermodel");
const Product = require("../../models/productsmodel");
const Shop = require("../../models/shopmodel");
const mongoose = require("mongoose");
const Rider = require("../../models/ridermodel");
const sendMail = require('../../utils/mailer'); 


let userMiddleware = require("../../middlewares/user-middleware");


routers.post("/checkout",userMiddleware, async (req, res) => {
  try {
    const { name, email, phone, address, paymentMethod } = req.body;
    const cart = req.cookies.cart;

    // Save form data in session in case login is required
    req.session.checkoutForm = { name, email, phone, address, paymentMethod };

    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).send("Cart is empty or invalid.");
    }

    // If user not logged in, redirect to login
    if (!req.session.user) {
      req.session.checkoutForm = { name, email, phone, address, paymentMethod };
      return res.redirect("/customerlogin");
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
        userId: req.session.user._id,
        userEmail: req.session.user.email,
        products,
        totalAmount: total,
        paymentMethod,
        shopId,
        
      });

      orderPromises.push(newOrder.save());
    }

    await Promise.all(orderPromises);

    res.clearCookie("cart");
    delete req.session.checkoutForm;

    return res.redirect("/order-success");

  } catch (error) {
    console.error("Checkout Error:", error.message, error.stack);
    return res.status(500).send("An error occurred during checkout.");
  }
});
routers.get('/order-success', (req, res) => {
  res.render('order-success');
});



const requireShopOwner = (req, res, next) => {
  // Assume shop owner's ID is stored in req.session.shopId
  if (!req.session.shopId) {
    return res.status(401).send("Unauthorized. Please log in as shop owner.");
  }
  next();
};

// GET /shop/orders
routers.get("/shop/orders", requireShopOwner, async (req, res) => {
  try {
    const shopId = req.session.shopId;

    const shop = await Shop.findById(shopId); // get current shop info
    const orders = await Order.find({ shopId })
      .sort({ createdAt: -1 })
      .populate("products.productId")
      .populate("rider");

    const riders = await Rider.find({ city: shop.city }); // get same-city riders only

    res.render("order", { orders, riders });
  } catch (err) {
    console.error("Failed to fetch orders:", err);
    res.status(500).send("Failed to load orders.");
  }
});





routers.post('/shop/orders/:orderId/assign-rider', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { riderId } = req.body;

    if (!riderId) return res.status(400).send('Rider ID is required');

    // Fetch order and shop
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).send('Order not found');

    const shop = await Shop.findById(req.session.shopId);
    if (!shop) return res.status(403).send('Shop not found or not logged in');

    // Fetch rider and validate city
    const rider = await Rider.findById(riderId);
    if (!rider) return res.status(404).send('Rider not found');

    if (rider.city !== shop.city) {
      return res.status(400).send('Cannot assign a rider from a different city.');
    }

    // Assign rider
    order.rider = riderId;
    order.deliveryStatus = 'assigned';
    await order.save();

    // ✅ Send email to rider
    await sendMail(
      rider.email,
      "New Delivery Assignment from Bazario",
      `<h2>Hello ${rider.name},</h2>
      <p>You’ve been assigned a new delivery by <strong>${shop.name}</strong>.</p>
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p>Please log in to your dashboard to view and accept the order.</p>
      <p>Regards,<br>Bazario Team</p>`
    );

    res.redirect('/shop/orders');
  } catch (err) {
    console.error('Error assigning rider:', err);
    res.status(500).send('Server Error');
  }
});









// Auth middleware to get user email (customize as per your session/login)
function requireLogin(req, res, next) {
  if (!req.session.user) {
    if (!req.session.redirectTo) {
      req.session.redirectTo = req.originalUrl; // remember where the user was going
    }
    return res.redirect("/customerlogin");
  }
  next();
}


// GET /customer/orders
routers.get("/myorders", requireLogin, async (req, res) => {
  try {
    const userEmail = req.session.user.email;

    const orders = await Order.find({userEmail})
      .populate({
        path: "userId",
        match: { email: userEmail }, // match userId.email
        select: "email name phone"   // only fetch selected fields
      })
      .populate("products.productId")
      .populate("rider")
      .sort({ createdAt: -1 });

    // Filter orders that actually matched the userId email
    const filteredOrders = orders.filter(order => order.userId !== null);

    res.render("customerorder", { orders: filteredOrders });

  } catch (error) {
    console.error("Error fetching customer orders:", error);
    res.status(500).send("An error occurred while fetching your orders.");
  }
});


module.exports=routers;