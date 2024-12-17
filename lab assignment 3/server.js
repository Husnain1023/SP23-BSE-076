const express = require("express");
var expressLayouts = require("express-ejs-layouts");
const mongoose=require("mongoose");

let server = express();


let cookieParser = require("cookie-parser");
server.use(cookieParser());

let session = require("express-session");
server.use(session({ secret: "my session secret" }));


server.set("view engine", "ejs");
server.use(expressLayouts);
server.use(express.static("public"));
server.use(express.static("uploads"));

server.use(express.urlencoded());
let adminProductsRouter = require("./routes/admin/products.controller");
const expressEjsLayouts = require("express-ejs-layouts");
server.use(adminProductsRouter);

let CategoriesRouter = require("./routes/admin/categories.controller")
server.use(CategoriesRouter);

server.get("/", async (req, res) => {
  let Product = require("./models/productsmodel");
  let products = await Product.find();
  let categories = require("./models/categorymodel");
  let category = await categories.find();

  return res.render("bootsrap", { products , category});
});
server.get("/portfolio", (req, res) => {
  return res.send(res.render("portfolio"));
});


let connectionString = "mongodb://127.0.0.1/mydatabase";
mongoose
  .connect(connectionString)
  .then(() => console.log("Connected to Mongo DB Server: " + connectionString))
  .catch((error) => console.log(error.message));


server.listen(1200, () => {
  console.log(`Server Started at localhost:5000`);
});


