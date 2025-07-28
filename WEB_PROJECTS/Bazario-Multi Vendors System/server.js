require('dotenv').config();

const express = require("express");
const mongoose = require("mongoose");
const multer = require('multer');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const server = express();

let cookieParser = require("cookie-parser");
server.use(cookieParser());

let session = require("express-session");
server.use(session({ secret: "my session secret" }));

// View engine setup
server.set("view engine", "ejs");
server.use(express.static("public"));
server.use(express.static("uploads"));
server.use("/uploads", express.static("uploads"));

// Body parsers
server.use(express.urlencoded({ extended: true }));
server.use(express.json());

// MongoDB connection
const connectionString = process.env.MONGODB_URI || "mongodb://127.0.0.1/website";
mongoose.connect(connectionString)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((error) => console.error("❌ MongoDB Error:", error.message));

// Multer file upload config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage: storage });

// Models
const Shop = require("./models/shopmodel");
const Category =require("./models/categorymodel");

const Complain = require("./models/complainmodel");

// Admin routes
const adminProductsRouter = require("./routes/admin/productscontroller");
server.use(adminProductsRouter);

const orderroute = require("./routes/shop/ordercontroller");
server.use(orderroute);

const userroute = require("./routes/shop/usercontroller");
server.use(userroute);


const cartcontroller = require("./routes/shop/cartcontroller");
server.use(cartcontroller);

const adminController = require('./routes/admin/admincontroller');
server.use(adminController);

const shopcontroller=require("./routes/shop/shopcontroller");
server.use(shopcontroller);

const ridercontroller=require("./routes/shop/ridercontroller");
server.use(ridercontroller);



// Home page route
server.get("/", async (req, res) => {
  const Product = require("./models/productsmodel");
  const products = await Product.find();
  const categories = await Category.find();
  const success = req.query.success;

  res.render("landingpage", { products, categories, success });
});

server.get("/complain", (req, res) => {
  res.render("complain"); // If you're using EJS or another templating engine
});

// POST: Submit a complaint
server.post('/complain', async (req, res) => {
  const { fullName, email, phone, type, orderId, message } = req.body;

  if (!fullName || !email || !type || !message) {
    return res.status(400).send('All required fields must be filled out.');
  }

  try {
    const newComplaint = new Complain({
      fullName,
      email,
      phone,
      type,
      orderId,
      message,
    });

    await newComplaint.save();
   res.redirect('/?success=1');
  } catch (err) {
    console.error('❌ Error saving complaint:', err); // Add this line
    res.status(500).send('Something went wrong. Please try again later.');
  }
});


// GET: Render registration form
server.get("/register", (req, res) => {
  res.render("register");
});

// POST: Handle shop registration & Safepay session
server.post("/register", upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'pictures' },
  { name: 'banners' }
]), async (req, res) => {
  try {
    const { name, address,city, email, phone, password } = req.body;

    if (!name || !email || !city || !phone || !password || !req.files.logo) {
      return res.status(400).send('Missing required fields.');
    }

    const logo = req.files.logo[0].filename;
    const pictures = req.files.pictures?.map(file => file.filename) || [];
    const banners = req.files.banners?.map(file => file.filename) || [];

    const dataToSave = {
      name,
      address,
      city,
      email,
      phone,
      password,
      logo,
      pictures,
      banners,
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'pkr',
          product_data: { name: 'Shop Registration Fee' },
          unit_amount: parseInt(process.env.FEE_AMOUNT),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.protocol}://${req.get('host')}/success?data=${encodeURIComponent(JSON.stringify(dataToSave))}`,
      cancel_url: `${req.protocol}://${req.get('host')}/register`,
    });

    return res.redirect(session.url);
  } catch (err) {
    console.error("Error in /register POST:", err);
    return res.status(500).send('Server error during registration.');
  }
});



// GET: Success Page
server.get('/success', async (req, res) => {
  try {
    const encodedData = req.query.data;
    if (!encodedData) {
      return res.status(400).send("Missing data in query.");
    }

    const shopData = JSON.parse(decodeURIComponent(encodedData));

    const ShopModel = require('./models/shopmodel'); // Update path as needed

    // Optional: Check if already exists
    const alreadyExists = await ShopModel.findOne({ email: shopData.email });
    if (alreadyExists) {
      return res.send("Shop already exists.");
    }

    // Save to DB
    const newShop = new ShopModel(shopData);
    await newShop.save();

    res.render("success", { shop: newShop }); // or use res.send("Success")
  } catch (err) {
    console.error("Error saving after payment:", err);
    res.status(500).send("Failed to save shop after payment.");
  }
});


// Login GET
server.get("/login", (req, res) => {
  res.render("login");
});

// Login POST
server.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingShop = await Shop.findOne({ email });

if (!existingShop) {
  return res.render("login", { message: "Shop not found." });
}

if (existingShop.password !== password) {
  return res.render("login", { message: "Invalid password." });
}

if (existingShop.status !== 'approved') {
  return res.render("login", { message: "Awaiting admin approval." });
}


    // ✅ Store shop ID in session
    req.session.shopId = existingShop._id;

    // ✅ Render shop page
    res.render("shoppage", { shop: existingShop ,isOwner: true });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).send("Server error.");
  }
}); 

server.get('/rider', (req, res) => {
  res.render('riderDashboard'); // render riderPortal.ejs
});


// Start server
server.listen(7500, () => {
  console.log(" Server started at http://localhost:7500");
});
