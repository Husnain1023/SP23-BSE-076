const express = require("express");
let router = express.Router();
let categories = require("../../models/categorymodel");



// route to handle Delete of product
router.get("/admin/category/delete/:id", async (req, res) => {
    let params = req.params;
    let category = await categories.findByIdAndDelete(req.params.id);
    
    return res.redirect("/admin/categories");
  });

  router.get("/admin/category/create", (req, res) => {
    res.render("admin/categoriesform", { 
      layout:"adminlayout",
      pageTitle: "Create New Product" });
  });


  router.post("/admin/category/create", async (req, res) => {
    let data = req.body;
    let newcategory = new categories(data);
    newcategory.title = data.title;
    await newcategory.save();
    return res.redirect("/admin/categories");
    // we will send data to model to save in db
  
    // return res.send(newProduct);
    // return res.render("admin/product-form", { layout: "adminlayout" });
  });


//route to render edit product form
router.get("/admin/category/edit/:id", async (req, res) => {
  let category = await categories.findById(req.params.id);
  return res.render("admin/categories-edit", {
    layout: "adminlayout",
    category,
  });
});
router.post("/admin/category/edit/:id", async (req, res) => {
  let category = await categories.findById(req.params.id);
  category.title = req.body.title;
  category.description = req.body.description;
  category.price = req.body.price;
  await category.save();
  return res.redirect("/admin/categories");
});

router.get("/admin/categories", async (req, res) => {
    let category = await categories.find();
    return res.render("admin/categories", {
      layout: "adminlayout",
      pageTitle: "Manage Your Products",
      category,
    });
  });


//pagenation
router.get("/admin/categories/:page?", async (req, res) => {
    let page = req.params.page;
    page = page ? Number(page) : 1;
    let pageSize = 2;
    let totalRecords = await categories.countDocuments();
    let totalPages = Math.ceil(totalRecords / pageSize);
    // return res.send({ page });
    let category = await categories.find()
      .limit(pageSize)
      .skip((page - 1) * pageSize);
  
    return res.render("admin/categories", {
      layout: "adminlayout",
      pageTitle: "Manage Your Products",
      category,
      page,
      pageSize,
      totalPages,
      totalRecords,
    });
  });  

  module.exports = router;
  