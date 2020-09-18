//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyparser =  require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose =  require("passport-local-mongoose");
const e = require('express');




const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyparser.urlencoded({extended:true}));
///setup session 
app.use(session({
    secret:"our little secret.",
    resave: false,
    saveUninitialized:false
}));

///inicializamos el passport packet 
app.use(passport.initialize());
///creamos una sesion con passport
app.use(passport.session());



///////////Database connection////////////////////
mongoose.connect("mongodb://localhost:27017/secretDB",{useNewUrlParser:true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true)
const userSchema = new mongoose.Schema ({email:String, password:String});
//encrypt password// 
userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




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
    User.register({username: req.body.username}, req.body.password, (err,user)=>{
        if(err){
            console.log(err);
            res.redirect("/");
        }
        else{
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/secrets")
            })
        }
    })
    
});

///secrets path 
app.get("/secrets", (req,res)=>{
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
})

///logout
app.get("/logout",(req,res)=>{
    req.logout();
    res.redirect("/");
})

app.post("/login", (req,res)=>{
    const user = new User({username:req.body.username,password:req.body.password});
    req.login(user,(err)=>{
        if(err){
            console.log(err)
        }else{
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/secrets");
            
            })
        }
    })
})








app.listen(3000, ()=>{
    console.log("Server running on port 3000.")
})
