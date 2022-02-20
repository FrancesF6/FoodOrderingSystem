const express = require('express');
const mongoose = require('mongoose');
let router = express.Router();

const Users = require('../models/userModel');

// import authentication and authorization functions
const sessionName = require('../authChecking').sessionName;
const checkAuth = require('../authChecking').checkAuth;
const checkUnAuth = require('../authChecking').checkUnAuth;


//**********************************************************************//
// router routes
router.get("/", getUsers, sendUsers);  // get users' list

router.get('/register', checkUnAuth, (req, res) => {res.render('register');});
router.post('/register', checkUnAuth, createNewUser);

router.get("/:userID", getUser, sendUser);  // get certain user's profile
router.post("/:userID", checkAuth, updateUserData);  // update user's privacy or password


//**********************************************************************//
// work with database

// maybe have query parameters maybe not
// Output: req.users = [ {_id, username, orderHistory:[]}, ...]
function getUsers(req, res, next) {
    let query = req.query;
    // console.log(query);
    let findUsers;
    if (query.name && typeof query.name === 'string') {
        findUsers = Users.find({privacy: false, username: {$regex: `${query.name}`, $options:"i"}}, {username:1, orderHistory:1});
    } else {
        findUsers = Users.find({privacy: false}, {username:1, orderHistory:1});   // need mongoID, username, and (number of) order
    }
    findUsers.exec((err, users) => {
        if (err) throw err;
        req.users = users;
        // console.log(users);
        next();
    });
}


// Input: req.body = {username, password}
function createNewUser(req, res) {
    if (req.body.username && req.body.password && typeof req.body.username == 'string' && typeof req.body.password == 'string') {
        // user name check - no duplicate
        Users.findOne({username: req.body.username}, {username:1})
        .exec((err, result) => {
            if (err) throw err;
            if (result !== null) {
                res.status(422).send("Duplicate username");
                return;
            }
            let newUser = new Users({username: req.body.username, password: req.body.password});
            newUser.save((err, user) => {
                if (err) {
                    // not pass username or password validations, send back messages
                    let message = '';
                    if (err.errors.hasOwnProperty("username")) message += `Username ${err.errors.username.properties.message}\n`;
                    if (err.errors.hasOwnProperty("password")) message += `Password ${err.errors.password.properties.message}\n`;
                    res.status(400).send(message);
                    return;
                }
                // automatically logged in
                // console.log(user);
                req.session.loggedin = true;
                req.session.username = user.username;
                req.session.userID = user._id;
                req.session.admin = user.admin;
                req.session.sessionName = sessionName;
                res.locals.session = req.session;   // seems can be omitted
                res.status(201).send(user._id);
            });
        });
    } else {
        res.status(400).send("Bad Request");
        return;
    }
}


// get user data from database according to the url param userID
// Output: req.user = {_id, username, privacy, orderHistory}
function getUser(req, res, next) {
    let uid;
	try { uid = new mongoose.Types.ObjectId(req.params.userID); }  // although Mongoose can cast string to ObjectId, better do casting before
    catch {
		res.status(404).send("Unknown ID");
		return;
	}
    Users.findById(uid, {username:1, privacy:1, orderHistory:1})
    .exec((err, user) => {
        if (err) throw err;
        if (user == null) {
            res.status(404).send("Unknown ID");
            return;
        }
        req.user = user;
        next();
    });
}


// Input: req.body = { privacy: boolean } or {password: string}
function updateUserData(req, res) {
    if (req.session.userID.toString() === req.params.userID) {
        if (typeof req.body.privacy === 'boolean') {
            Users.findByIdAndUpdate({_id: req.session.userID}, {privacy: req.body.privacy}, {runValidators: true})
            .exec((err, result) => {
                if (err) throw err;
                res.status(200).send();
            });
        } else if (typeof req.body.password === 'string') {
            Users.findByIdAndUpdate({_id: req.session.userID}, {password: req.body.password}, {runValidators: true})
            .exec((err, result) => {
                if (err) {
                    if (err.errors.hasOwnProperty("password")) {
                        let message = `Password ${err.errors.password.properties.message}`;
                        res.status(400).send(message);
                        return;
                    }
                }
                res.status(200).send();
            });
        } else {
            res.status(400).send("Bad Request");
            return;
        }
    } else {
        res.status(403).send("Forbidden");
        return;
    }
}


//**********************************************************************//
// only send responses

// Output: users = [ {_id, username, numberOfOrders}, ...]
function sendUsers(req, res, next) {
    let users = [];
    for (let user of req.users) {
        let aUser = {
            _id: user._id,
            username: user.username,
            numberOfOrders: user.orderHistory.length
        };
        users.push(aUser);
    }
    res.render('users', {users: users});
}


function sendUser(req, res, next) {
    // if user loggedin and is the same user of profile page
    if (req.session.loggedin && req.session.sessionName === sessionName
        && req.session.username === req.user.username
        && req.session.userID.toString() === req.user._id.toString()) {
        res.render('user', {user: req.user, owner: true});
        return;
    }
    // if profile page is private, and not owner
    if (req.user.privacy == true) {
        res.status(403).send("Forbidden");
        return;
    } else {   // profile page is public
        res.render('user', {user: req.user, owner: false});
    }
}



module.exports = router;