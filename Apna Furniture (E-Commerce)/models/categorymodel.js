const mongoose = require("mongoose");

let categorySchema = mongoose.Schema({


    title: String,
    stock:Boolean,
    description: String,
    
});

let CategoryModel = mongoose.model("categories" , categorySchema);

module.exports = CategoryModel;
