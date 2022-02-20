const express = require('express');
let router = express.Router();

const Restaurants = require('../models/restaurantModel');
const Orders = require('../models/orderModel');
const Users = require('../models/userModel');

// import authentication and authorization functions
const sessionName = require('../authChecking').sessionName;
const checkAuth = require('../authChecking').checkAuth;
// const checkUnAuth = require('../authChecking').checkUnAuth;


//**********************************************************************//
// router routes
router.get('/', checkAuth, getRestaurantList, sendOrderForm);  // get order form page
router.post('/', checkAuth, placeNewOrder);   // receive and process a new order placed by user

router.get('/:orderID', getOrder, sendOrder);  // get an order
router.put('/:orderID', checkAuth, rateOrder);   // receive and process an order's rate from its owner


//**********************************************************************//
// work with database

// only get restaurants visible to users
// Output: req.restaurantList = [{_id, name}, ...]
function getRestaurantList(req, res, next) {
    Restaurants.find({visibility: true}, {name: 1})
    .exec((err, result) => {
        if (err) throw err;
        req.restaurantList = result;
        next();
    });
}


// Input: req.body = {restaurantID, userID, subtotal, total, fee, tax, order: {dish: quantity, ...}, no rate for now
function placeNewOrder(req, res) {
    // 0 - add attribute userID from req.session to req.body
    req.body.userID = req.session.userID;
    // 1 - save new order to orders collection
    let newOrder = new Orders(req.body);
    newOrder.save((err, order) => {
        if (err) {
            console.log(err);
            res.status(500).send("Save Order Failed.");
            return;
        }
        // console.log(order);

        // 2 - save new order's _id to its user's order history field
        Users.findByIdAndUpdate(order.userID, {$push: {orderHistory: order._id}})
        .exec((err, user) => {
            if (err) {
                console.log(err);
                res.status(500).send("Save Order Failed.");
                return;
            }

            // 3 - save new order's _id to its restaurant's sales history field
            Restaurants.findByIdAndUpdate(order.restaurantID, {$push: {salesHistory: order._id}})
            .exec((err, restaurant) => {
                if (err) {
                    console.log(err);
                    res.status(500).send("Save Order Failed.");
                    return;
                }
                res.status(201).json(order._id);   // send back order _id for redirecting
            });
        });
    });
}


// Output: req.order = {_id: ObjectId, userID: {_id, username, privacy}, restaurantID: {_id, name}, <all fields in order model> ...}
function getOrder(req, res, next) {
    let oid;
	try { oid = new mongoose.Types.ObjectId(req.params.orderID); }
    catch {
		res.status(404).send("Unknown ID");
		return;
	}
    // retrieve order data (with populated username and restaurant name)
    Orders.findById(oid)
    .populate('userID', 'username privacy')
    .populate('restaurantID', 'name')
    .exec((err, order) => {
        if (err) throw err;
        if (order == null) {
            res.status(404).send("Unknown ID");
            return;
        }
        req.order = order;
        // console.log(req.order);
        next();
    });
}


// Input: req.body = { rate: Number }
function rateOrder(req, res) {
    if (typeof req.body.rate === 'number' && !isNaN(req.body.rate)) {
        let oid;
        try { oid = new mongoose.Types.ObjectId(req.params.orderID); }
        catch {
            res.status(404).send("Unknown ID");
            return;
        }
        // 1 - save rate to order's document's rate field
        Orders.findByIdAndUpdate(oid, {rate: req.body.rate}, {runValidators: true})
        .exec((err, order) => {
            if (err) {
                res.status(400).send("Please rate 1~5 star");   // out of range
                return;
            }
            // 2 - save rate to restaurant's document's receivedRates (array) field
            Restaurants.findByIdAndUpdate(order.restaurantID, {$push: {receivedRates: req.body.rate}})
            .exec((err, restaurant) => {
                if (err) return;
                res.status(201).send();
            });
        });
    } else {
        res.status(400).send("Bad Request");
        return;
    }
}


//**********************************************************************//
// only send responses

function sendOrderForm(req, res, next) {
    res.render('orderForm', {restaurantList: req.restaurantList});
}


function sendOrder(req, res, next) {
    // if user loggedin and is the owner of order page
    if (req.session.loggedin && req.session.sessionName === sessionName
        && req.session.username === req.order.userID.username
        && req.session.userID.toString() === req.order.userID._id.toString()) {
        res.render('order', {order: req.order, owner: true});
    }
    // if not owner, but user's privacy is public (false)
    else if (!req.order.userID.privacy) {
        res.render('order', {order: req.order, owner: false});
    }
    // if not owner, and user's privacy is private (true)
    else { res.status(403).send("Forbidden"); }
}



module.exports = router;