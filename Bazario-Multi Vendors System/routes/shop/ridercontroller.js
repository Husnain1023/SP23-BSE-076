const express = require("express");
const router = express.Router();
const Rider = require("../../models/ridermodel");
const Order =   require("../../models/ordermodel");
const User =   require("../../models/ordermodel");
const sendMail = require('../../utils/mailer');
// Rider Registration - GET form
router.get("/rider/register", (req, res) => {
  res.render("riderregister");
});
router.get("/riderDashboard",async(req,res)=>{
    return res.render("riderDashboard");
})

// Rider Registration - POST submit
router.post("/rider/register", async (req, res) => {
  try {
    const { name, email, phone, city, password, password2 } = req.body;
    if (!name || !email || !phone || !password || !password2) {
      return res.status(400).send("Please fill all fields");
    }
    if (password !== password2) {
      return res.status(400).send("Passwords do not match");
    }
    // Check if email exists
    const existingRider = await Rider.findOne({ email });
    if (existingRider) {
      return res.status(400).send("Email already registered");
    }

    const rider = new Rider({ name, email, phone,city, password });
    await rider.save();
    res.render("riderlogin");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Rider Login - GET form
router.get("/riderlogin", (req, res) => {
  res.render("riderlogin");
});

// Rider Login - POST submit
router.post("/rider/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send("Please provide email and password");
    }

    const rider = await Rider.findOne({ email, password }); // Note: use bcrypt in production
  if (!rider) {
    // Re-render the login page with an error message
    return res.render("riderlogin", { message: "Login Failed: Invalid credentials" });
  }
    req.session.riderId = rider._id;
    res.redirect("/riderpage");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

// Rider logout
router.get("/rider/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/rider/login");
  });
});



router.get("/riderpage", async (req, res) => {
  try {
    const riderId = req.session.riderId;
    const rider = await Rider.findById(riderId);

    // Fetch orders assigned to this rider
    const orders = await Order.find({ rider: riderId })

      .populate("products.productId")
      .populate("shopId")
      .sort({ createdAt: -1 });

    res.render("riderpage", { rider, orders });
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to load dashboard");
  }
});





router.post("/rider/order/:orderId/accept", async (req, res) => {
  try {
    // 1. Update order status and populate shop info
    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      {
        riderStatus: "accepted",
        deliveryStatus: "assigned"
      },
      { new: true }
    ).populate("shopId"); // ← this gives you shop info in `order.shopId`

    if (!order || !order.shopId) {
      return res.status(404).send("Order or associated shop not found.");
    }

    const shop = order.shopId;

    // 2. Send mail to shop owner
    await sendMail(
      shop.email, // Shop owner's email
      "Order Accepted by Rider",
      `<h2>Hello ${shop.name},</h2>
      <p>Your order <strong>#${order._id}</strong> has been accepted by a rider and is now being processed for delivery.</p>
      <p>You can track the order in your shop dashboard.</p>
      <p>Regards,<br>Bazario Delivery Team</p>`
    );

    res.redirect("/riderpage");
  } catch (err) {
    console.error("Error in rider accept order route:", err);
    res.status(500).send("Something went wrong while accepting the order.");
  }
});


router.post("/rider/order/:orderId/reject", async (req, res) => {
  const reason = req.body.reason;
  await Order.findByIdAndUpdate(req.params.orderId, {
    riderStatus: "rejected",
    rider: null,
    deliveryStatus: "not_assigned",
    riderRejectionReason: reason
  });
  res.redirect("/riderpage");
});




router.post("/shop/orders/:orderId/reassign", async (req, res) => {
  const newRiderId = req.body.newRiderId;

  await Order.findByIdAndUpdate(req.params.orderId, {
    rider: newRiderId,
    riderStatus: "not_assigned",
    riderRejectionReason: null
  });

  res.redirect("/shop/orders");
});




// Mark as Picked or Delivered
router.post("/update-status/:orderId", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      return res.status(404).send("Order not found");
    }

    // Rider must be the assigned one
    if (order.rider.toString() !== req.session.riderId) {
      return res.status(403).send("Not authorized to update this order");
    }

    if (order.deliveryStatus === "assigned") {
      order.deliveryStatus = "picked_up";
      order.status="shipped";
    } else if (order.deliveryStatus === "picked_up") {
      order.deliveryStatus = "delivered";
      order.status = "delivered"; // optional if you want to sync with overall order status
    }

    await order.save();

    res.redirect("/riderpage");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});





module.exports = router;
