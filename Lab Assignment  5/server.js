const express = require("express");
var expressLayouts = require("express-ejs-layouts");
let server = express();
server.set("view engine", "ejs");
server.use(expressLayouts);
server.use(express.static("public"));

let adminProductsRouter = require("./routes/admin/products.controller");
const expressEjsLayouts = require("express-ejs-layouts");
server.use(adminProductsRouter);

server.get("/", (req, res) => {
  return res.render("bootsrap");
});
server.get("/portfolio", (req, res) => {
  return res.send(res.render("portfolio"));
});

server.get("/admin/products/create", (req, res) => {
  res.render("admin/productform", { 
    layout:"adminlayout",
    pageTitle: "Create New Product" });
});


server.listen(5000, () => {
  console.log(`Server Started at localhost:5000`);
});
