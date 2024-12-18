const express = require("express");
var expressLayouts = require("express-ejs-layouts");
const mongoose=require("mongoose");


let server = express();


let Product = require("./models/productsmodel");
let User = require("./models/usermodel");


let cookieParser = require("cookie-parser");
server.use(cookieParser());

let session = require("express-session");
server.use(session({ secret: "my session secret" }));


let siteMiddleware = require("./middlewares/site");
let authorizationMiddleware = require("./middlewares/authorization-middleware");

server.set("view engine", "ejs");
server.use(expressLayouts);
server.use(express.static("public"));
server.use(express.static("uploads"));

server.use(express.urlencoded());
let userCartsRouter=require("./routes/user/carts.controller");
let adminProductsRouter = require("./routes/admin/products.controller");

const expressEjsLayouts = require("express-ejs-layouts");
server.use(expressEjsLayouts);
//server.use(adminProductsRouter);
let CategoriesRouter = require("./routes/admin/categories.controller")
server.use(CategoriesRouter);


server.use(siteMiddleware);

server.get("/aboutme", authorizationMiddleware, (req, res) => {
  return res.render("aboutme");
});
server.get("/logout", async (req, res) => {
  req.session.user = null;
  return res.redirect("/login");
});
server.get("/login", async (req, res) => {
  return res.render("authorization/login");
});
server.post("/login", async (req, res) => {
  let data = req.body;
  let user = await User.findOne({ email: data.email });
  if (!user) return res.redirect("/registration");
  isValid = user.password == data.password;
  if (!isValid) return res.redirect("/login");
  req.session.user = user;
  return res.redirect("/");
});
/*server.post("/login", async (req, res) => {
  let data = req.body;
  let user = await User.findOne({ email: data.email});
  if (!user) return res.redirect("/registration");
  isValid = user.password == data.password;
  if (!isValid) return res.redirect("/login");
  //isRole=user.role== data.role;
  if (!isRole) return res.redirect("/registration");
  req.session.user = user;
  return res.redirect("/");
});*/

server.get("/registration", async (req, res) => {
  return res.render("authorization/registration");
});

server.post("/registration", async (req, res) => {
  let data = req.body;
  let user = await User.findOne({ email: data.email });
  if (user) return res.redirect("/registration");
  user = new User(data);
  await user.save();
  return res.redirect("/login");
});

/*server.post("/registration", async (req, res) => {
  const data = req.body;
  let user = await User.findOne({ email: data.email });
  if (user) {
    if (!user.role.includes(data.role)) {
      user.role.push(data.role); // Add the new role
      await user.save(); // Save the updated user
      return res.redirect("/login"); // Redirect to login
    } else {
      return res.status(400).send("User with this role already exists."); // Role already exists
    }
  }
  user = new User({
    name: data.name,
    email: data.email,
    password: data.password,
    role: [data.role], // Initialize with the provided role
  });

  await user.save(); // Save the new user
  return res.redirect("/login"); // Redirect to login
});*/


/*
server.get("/cart", async (req, res) => {
  let cart = req.cookies.cart;
  cart = cart ? cart : [];

  // Filter out invalid ObjectId entries
  const validIds = cart.filter((id) => mongoose.Types.ObjectId.isValid(id));

  // Fetch products with valid IDs
  let products = await Product.find({ _id: { $in: validIds } });

  return res.render("cart", 
    {layout:"adminlayout",
       products });
});


server.get("/add-to-cart/:id", (req, res) => {
  const productId = req.params.id;

  // Validate the productId
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).send("Invalid product ID");
  }

  let cart = req.cookies.cart;
  cart = cart ? cart : [];

  // Avoid duplicates in the cart
  if (!cart.includes(productId)) {
    cart.push(productId);
    res.cookie("cart", cart);
  }

  return res.redirect("/");
  
});*/


let adminMiddleware = require("./middlewares/admin-middleware");
// Admin middleware and routes
server.use("/", authorizationMiddleware, (req, res, next) => {
  const userRoles = req.session.user?.role || [];
  const isAdmin = userRoles.includes("admin");

  if (isAdmin) {
    // Admin-specific middleware and routes
    adminMiddleware(req, res, () => adminProductsRouter(req, res, next));
  } else {
    next(); // Move to the next middleware if not admin
  }
});

// Middleware for non-admin users
server.use("/", authorizationMiddleware, (req, res, next) => {
  const userRoles = req.session.user?.role || [];
  const isAdmin = userRoles.includes("admin");

  if (!isAdmin) {
    // Routes specific to regular users
    userCartsRouter(req, res, next);
  } else {
    next(); // Skip this middleware for admin users
  }
});



server.get("/", async (req, res) => {
  let Product = require("./models/productsmodel");
  let products = await Product.find();
  let categories = require("./models/categorymodel");
  let category = await categories.find();

  return res.render("bootsrap", { products , category});
});

/*server.post("/checkout", async (req, res) => {
  try {
    const { name, email, number, location } = req.body;
    const cart = req.session.cart || [];

    if (!cart.length) return res.status(400).send("Cart is empty!");

    for (const productId of cart) {
      await OrderModel.create({
        shippingDetails: { name, email, number, location },
        product: productId,
      });
    }

    req.session.cart = []; // Clear cart after order creation
    res.redirect("/order/success");
  } catch (err) {
    res.status(500).send("Error creating order");
  }
});*/




let connectionString = "mongodb://127.0.0.1/mydatabase";
mongoose
  .connect(connectionString)
  .then(() => console.log("Connected to Mongo DB Server: " + connectionString))
  .catch((error) => console.log(error.message));


server.listen(4000, () => {
  console.log(`Server Started at localhost:4000`);
});


