require('dotenv').config()
const express = require("express");
const ejs = require('ejs');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static("public"));

mongoose.connect('mongodb://127.0.0.1:27017/userDB');

const userSchema = new mongoose.Schema({
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

app.post("/register", (req, res) => {

    bcrypt.hash(req.body.password, saltRounds, async function (err, hash) {
        if (err) {
            console.log(err)
        }
        try {
            const newUser = new User({
                email: req.body.username,
                password: hash
            });


            await newUser.save();
            console.log("Successfully Saved new User");

            res.render("secrets");
        } catch (err) {
            console.log(err);
            res.status(500).send("Error occurred while saving the user.");
        }
    });


});


app.post("/login", (req, res) => {
    const userName = req.body.username;
    const password = req.body.password;

    User.findOne({ email: userName })
        .then((doc) => {
            if (!doc) {
                console.log("No such user found")
            } else {
                bcrypt.compare(password, doc.password, function (err, result) {
                    if (result == true) {
                        res.render("secrets");
                    } else {
                        console.log("Wrong password")
                    }

                });
            }
        })
        .catch((err) => {
            console.log(err)
        })
})

app.listen(3000, () => {
    console.log("Server started on port 3000")
})