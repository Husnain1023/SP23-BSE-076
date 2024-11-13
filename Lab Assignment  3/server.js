const express=require("express")
 let server=express()

 server.set("view engine","ejs");
 server.use(express.static("public"));

 

 


  server.get("/bootsrap", (req, res) => {
    return res.render("bootsrap");
  });
  server.get("/portfolio", (req, res) => {
    return res.send(res.render("portfolio"));
  });


  
  server.listen(5000, () => {
    console.log(`Server Started at localhost:5000`);
  });