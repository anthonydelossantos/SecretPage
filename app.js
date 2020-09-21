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
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate =  require("mongoose-findorcreate");




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
const userSchema = new mongoose.Schema ({email:String, password:String,googleId:String});
//encrypt password// 
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());
passport.serializeUser((user,done)=>{done(null,user.id)});
passport.deserializeUser((id,done)=>{User.findById(id,(err,user)=>{done(err,user)})  });


passport.use(new GoogleStrategy({
    clientID:process.env.CLIENTID,
    clientSecret:process.env.CLIENTSECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
},
(accessToken, refreshToken, profile, cb)=>{console.log(profile);User.findOrCreate({googleId: profile.id},(err,user)=>{return cb(err,user)})})
    );




//////////get pages ////////////////////////////////

app.get("/",(req,res)=>{res.render("home")});
app.get("/auth/google",passport.authenticate("google",{scope:["profile"]}));
app.get("/auth/google/secrets",passport.authenticate('google',{failureRedirect:"/login"}),(req,res)=>{res.redirect("/secrets");});
app.get("/login",(req,res)=>{res.render("login");});
app.get("/register",(req,res)=>{res.render("register");});



/////////////////////////post pages////////////////////////////////////////

app.post("/register",(req,res)=>{
    User.register({username: req.body.username}, req.body.password, (err,user)=>{
        if(err){
            console.log(err);
            res.redirect("/");
        }
        else{passport.authenticate("local")(req,res,()=>{res.redirect("/secrets")})}
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
