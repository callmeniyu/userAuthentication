require('dotenv').config()
const express = require("express");
const ejs = require('ejs');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const md5 = require("md5");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static("public"));

mongoose.connect('mongodb://127.0.0.1:27017/userDB');

const userSchema =new mongoose.Schema({
    email: String,
    password: String
});



const User = mongoose.model("User", userSchema);


app.get("/", (req, res) => {
    res.render("home")
});

app.get("/login", (req, res) => {
    res.render("login")
});

app.get("/register", (req, res) => {
    res.render("register")
});

app.post("/register", async (req, res) => {
    try {
        const newUser = new User({
            email: req.body.username,
            password: md5(req.body.password)
        });

        await newUser.save();
        console.log("Successfully Saved new User");

        res.render("secrets");
    } catch (err) {
        console.log(err);
        res.status(500).send("Error occurred while saving the user.");
    }
});
 

app.post("/login", (req, res) => {
    const userName = req.body.username;
    const password = md5(req.body.password);

    User.findOne({ email: userName })
        .then((doc) => {
            if (!doc) {
                console.log("No such user found")
            } else {
                if (doc.password === password) {
                    res.render("secrets")
                } else {
                    console.log("Wrong password")
                }
            }
        })
        .catch((err) => {
            console.log(err)
        })
})

app.listen(3000, () => {
    console.log("Server started on port 3000")
})