const express = require('express');
let router = express.Router();

const Restaurants = require('../models/restaurantModel');

// import authentication and authorization functions
// const sessionName = require('../authChecking').sessionName;
const checkAuth = require('../authChecking').checkAuth;
// const checkUnAuth = require('../authChecking').checkUnAuth;
const checkAdmin = require('../authChecking').checkAdmin;


//**********************************************************************//
// router routes
router.get('/', checkAdmin, getRestaurantList, sendRestaurantList);   // admin browse restaurants list
router.get('/add', checkAdmin, (req, res) => res.render('addrestaurant'));   // form to add new restaurant
router.post('/add', checkAdmin, addNewRestaurant);   // process and add new restaurant to database
router.get('/stats', checkAdmin, getRestaurantSalesData, computeStats, sendStats);   // restaurants stats
router.get('/:restID', checkAuth, getARestaurant, sendARestaurant);   // get a restaurant info
router.put('/:restID', checkAdmin, updateARestaurant);   // update a restaurant (info & menu)


//**********************************************************************//
// work with database

// Output: req.restaurantList = [{_id, name, receivedRates}, ...]
function getRestaurantList(req, res, next) {
    Restaurants.find({}, {name:1, receivedRates:1})
    .exec((err, restaurants) => {
        if (err) throw err;
        req.restaurantList = restaurants;
        // console.log(req.restaurantList);
        next();
    });
}


// receive: {name: String, delivery_fee: Number, min_order: Number}, send restaurant's _id back
function addNewRestaurant(req, res) {
    if (req.body.name && typeof req.body.delivery_fee === 'number' && typeof req.body.min_order === 'number') {
        let newRestaurant = new Restaurants({
            name: req.body.name,
            delivery_fee: req.body.delivery_fee,
            min_order: req.body.min_order,
            menu: {}
        });
        newRestaurant.save((err, restaurant) => {
            if (err) throw err;
            // console.log(restaurant);
            res.status(201).json(restaurant._id);
        });
    } else {
        res.status(400).send("Bad Request");
        return;
    }
}


// only called to get restaurants sales data, retrieves many order data from database
// Output: req.restaurants = [{_id, name, salesHistory: [{_id, total, order:{ dish: quantity, ...}}, ...], receivedRates: [2, ...]}, ...]
function getRestaurantSalesData(req, res, next) {
    Restaurants.find({}, {name:1, salesHistory:1, receivedRates:1})
    .populate('salesHistory', 'total order')
    .exec((err, restaurants) => {
        if (err) throw err;
        req.restaurants = restaurants;
        // console.log(req.restaurants);
        next();
    });
}


// compute restaurants stats into readable (pug-friendly / json) stats
// Input: req.restaurants = [{_id, name, salesHistory: [{_id, total, order:{ dish: quantity, ...}}, ...], receivedRates: [2, ...]}, ...]
// Output: req.restaurantStats = { _id: {name, numberOfOrders, avgOrder, popularDishes: [[dish, quantity], ...] (descending) }, ...}
function computeStats(req, res, next) {
    let restaurantStats = {};
    for (let restaurant of req.restaurants) {
        let totalOrder = 0;
        let dishPopularity = {};
        // iterate salesHistory to collect totalOrder and dishPopularity
        for (let order of restaurant.salesHistory) {
            totalOrder += order.total;
            for (let dishName in order.order) {   // order.order = {"dish1": 1, "dish2": 2, ...}
                if (dishPopularity.hasOwnProperty(dishName)) {
                    dishPopularity[dishName] += order.order[dishName];
                } else {
                    dishPopularity[dishName] = order.order[dishName];
                }
            }
        }
        // sort dishPopularity descending to popularDishes
        let popularDishes = [];
        for (let dish in dishPopularity) {
            popularDishes.push([dish, dishPopularity[dish]]);
        }
        popularDishes.sort(function(a, b) {
            return b[1] - a[1];
        });
        // limit the THREE most popular dishes
        popularDishes = popularDishes.slice(0, 3);
        restaurantStats[restaurant._id] = {
            name: restaurant.name,
            numberOfOrders: restaurant.salesHistory.length,
            avgOrder: (restaurant.salesHistory.length > 0) ? (totalOrder/restaurant.salesHistory.length).toFixed(2) : NaN,
            popularDishes: popularDishes
        };
    }
    req.restaurantStats = restaurantStats;
    // console.log(req.restaurantStats);
    next();
}


// not retrieve salesHistory, and compute restaurant's average rate
// Output: req.restaurant = {_id, name, min_order, delivery_fee, visibility, menu: {}, rate}
function getARestaurant(req, res, next) {
    let rid;
	try { rid = new mongoose.Types.ObjectId(req.params.restID); }
    catch {
		res.status(400).send("Bad Request");
		return;
	}
    let findRestaurant;
    // (already checked loggedin user) if not admin, cannot get unvisible restaurant
    if (!req.session.admin) findRestaurant = Restaurants.findOne({_id: rid, visibility: true}, {salesHistory:0});
    else findRestaurant = Restaurants.findById(rid, {salesHistory:0});
    findRestaurant.exec((err, result) => {
        if (err) throw err;
        let restaurant = {
            _id: result._id,
            name: result.name,
            min_order: result.min_order,
            delivery_fee: result.delivery_fee,
            visibility: result.visibility,
            menu: result.menu,
            rate: computeAvgOfArray(result.receivedRates)
        };
        req.restaurant = restaurant;
        // console.log(req.restaurant);
        next();
    });
}


// receive restaurant data and validate
function updateARestaurant(req, res) {
    let restID = req.params.restID;
    let restData = req.body;
    // console.log(restData);

    // check received object's attribute _id equal to restID
    if (!restData._id || restID !== restData._id) {
        res.status(400).send("Bad Request");
		return;
    }

    let rID;
	try { rID = new mongoose.Types.ObjectId(restID); }
    catch {
		res.status(404).send("Unknown ID");
		return;
	}

    // check if restData is restaurant info or menu data, and validate
    if (restData.name && typeof restData.name === 'string' && restData.name.trim().length > 0
        && typeof restData.visibility === 'boolean'
        && typeof restData.min_order === 'number' && !isNaN(restData.min_order)
        && typeof restData.delivery_fee === 'number' && !isNaN(restData.delivery_fee)) {
        Restaurants.findByIdAndUpdate(rID, {
            name: restData.name.trim(),
            min_order: restData.min_order,
            delivery_fee: restData.delivery_fee,
            visibility: restData.visibility
        }).exec((err, result) => {
            if (err) throw err;
            if (result == null) {
                res.status(404).send("Unknown ID");
                return;
            }
            res.status(200).send();
        });
    } else if (restData.menu && typeof restData.menu === 'object') {
        for (let category in restData.menu) {
            if (typeof restData.menu[category] !== 'object' || typeof restData.menu[category].length !== 'number' ) {   // if not array
                res.status(400).send("Bad Request");
                return;
            }
            for (let dish of restData.menu[category]) {
                if (!dish.name || typeof dish.name !== 'string'
                    || !dish.price || typeof dish.price !== 'number'
                    || typeof dish.description !== 'string') {
                    res.status(400).send("Bad Request");
                    return;
                }
            }
        }
        Restaurants.findByIdAndUpdate(rID, {menu: restData.menu})
        .exec((err, result) => {
            if (err) throw err;
            if (result == null) {
                res.status(404).send("Unknown ID");
                return;
            }
            res.status(200).send();
        });
    } else {
        res.status(400).send("Bad Request");
		return;
    }
}


//**********************************************************************//
// only send responses

// Input: req.restaurantList = [{_id, name, receivedRates}, ...]
// Output: restaurantList = [{_id: ObjectId, name: String, avgRate: Number}, ...]
// send text/html, application/json
function sendRestaurantList(req, res) {
    let restaurantList = [];
    for (let restaurant of req.restaurantList) {
        let restaurantData = {
            _id: restaurant._id,
            name: restaurant.name,
            avgRate: computeAvgOfArray(restaurant.receivedRates)
        };
        restaurantList.push(restaurantData);
    }
    res.format({
        'text/html': () => {
            res.set('Content-Type', 'text/html');
            res.render('restaurants', {restaurants: restaurantList});
        },
        'application/json': () => {
            res.set('Content-Type', 'application/json');
            res.json(restaurantList);
        },
        'default': () => { res.status(406).send('Not Acceptable'); }
    });
}


// send text/html, application/json
function sendARestaurant(req, res) {
    res.format({
        'text/html': () => {
            res.set('Content-Type', 'text/html');
            res.render('restaurant', {restaurantname: req.restaurant.name});
        },
        'application/json': () => {
            res.set('Content-Type', 'application/json');
            res.json(req.restaurant);
        },
        'default': () => { res.status(406).send('Not Acceptable'); }
    });
}


// send text/html, application/json
function sendStats(req, res) {
    res.format({
        'text/html': () => {
            res.set('Content-Type', 'text/html');
            res.render('stats', {stats: req.restaurantStats});
        },
        'application/json': () => {
            res.set('Content-Type', 'application/json');
            res.json(req.restaurantStats);
        },
        'default': () => { res.status(406).send('Not Acceptable'); }
    });  
}


//**********************************************************************//
// helper functions

// returns average number of an array of numbers or 0 if empty
function computeAvgOfArray(arr) {
    let sum = arr.reduce((a, b) => a + b, 0);
    let avgRate = (arr.length > 0) ? sum/arr.length : 0;
    return avgRate;
}



module.exports = router;