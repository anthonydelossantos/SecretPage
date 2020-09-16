//jshint esversion:6

const express = require("express");
const bodyparser =  require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyparser.urlencoded({extended:true}));


///////////Database connection////////////////////
mongoose.connect("mongodb://localhost:27017/secretDB",{useNewUrlParser:true, useUnifiedTopology: true});
const userSchema = new mongoose.Schema ({email:String, password:String});
//encrypt password// 
const secret = "thisisourlittlesecret.";
userSchema.plugin(encrypt,{secret:secret,encryptedFields:['password']});
const User = new mongoose.model("User", userSchema)



//////////get pages ////////////////////////////////

app.get("/",(req,res)=>{
    res.render("home");
});

app.get("/login",(req,res)=>{
    res.render("login");
});

app.get("/register",(req,res)=>{
    res.render("register");
});


/////////////////////////post pages////////////////////////////////////////

app.post("/register",(req,res)=>{
    let user = req.body.username; 
    let password = req.body.password;
    const newUser= new User({
        email:user , 
        password:password
    });
    newUser.save((err)=>{
        if (err){
            console.log(err);
        }
        else{
            res.render("secrets");
        }
    })
});

app.post("/login", (req,res)=>{
    const username= req.body.username; 
    const password = req.body.password;

    User.findOne({email:username},(err,foundUser)=>{
        if(err){
            document.write("<h1>Upss we have a error</h1>")
        }

        else{
            if(foundUser){
                if (foundUser.password === password){
                    res.render("secrets"); 
                }

                if (foundUser.password != password){
                    res.render("passwdFail");
                    
                }
            }
        }
    })
})








app.listen(3000, ()=>{
    console.log("Server running on port 3000.")
})
