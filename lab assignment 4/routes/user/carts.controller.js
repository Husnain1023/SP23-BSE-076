const express = require("express");
let routers = express.Router();
let Product = require("../../models/productsmodel");
const mongoose=require("mongoose");


routers.get("/cart", async (req, res) => {
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
  
  
  routers.get("/add-to-cart/:id", (req, res) => {
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
    
  });


  routers.get("/checkout", (req, res) => {
    res.render("checkout", { 
      
      pageTitle: "Create New Product" });
  });

  routers.post("/cart/delete/:id", (req, res) => {
    const targetId = req.params.id;

    // Retrieve the cart from cookies, defaulting to an empty array if not present
    let currentCart = req.cookies.cart || [];

    // Filter out the item to be removed
    const updatedCart = currentCart.filter(cartItemId => cartItemId !== targetId);

    // Save the updated cart back to cookies
    res.cookie("cart", updatedCart);

    // Redirect back to the cart page
    return res.redirect("/cart");
});


 // Assuming you have a Cart model

// Route to render the checkout page
// Adjust this import path to your project structure

// Proceed to Checkout
routers.get("/users/proceed-to-checkout", async (req, res) => {
    let cart = req.cookies.cart;
    cart = cart ? cart : [];
  
    // Filter out invalid ObjectId entries
    const validIds = cart.filter((id) => mongoose.Types.ObjectId.isValid(id));
  
    // Fetch products with valid IDs
    let products = await Product.find({ _id: { $in: validIds } });
  
    return res.render("checkout", 
      {layout:"adminlayout",
         products });
  });








  

  

  routers.get('/homepage', async (req, res) => {
    try {
        const products = await Product.find(); // Fetch all products from the database
        res.render('homepage', {
             products }); // Pass products to EJS
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Server error');
    }
  });


  // Update Cart Quantity

  
  module.exports = routers;