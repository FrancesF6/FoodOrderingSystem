const mongoose = require('mongoose');
const fs = require("fs");

const users = require('./json/users.json');
const restaurants = [];

const dbURI = `mongodb+srv://${process.env.FOSdatabaseUsr}:${process.env.FOSdatabasePsw}@franceswebsite.dhbvc.mongodb.net/FoodOrderSysDB?retryWrites=true&w=majority`;

const Restaurants = require('./models/restaurantModel');
const Users = require('./models/userModel');


// potiential problems here, dropping database seems to take some time on cloud
// there comes MongoServerError: Cannot create collection FoodOrderSysDB.users - database is in the process of being dropped
mongoose.connect(dbURI, {useNewUrlParser: true});
let db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
	db.dropDatabase((err, result) => {
		if (err) return console.log("Error dropping database:", err);
		console.log("Dropped food ordering system database successfully. Starting re-creation.");
		
		// read restaurants data from json files
		fs.readdir("./json/restaurants", (err, files) => {
			if (err) return console.log(err);
			for (let file of files) {
				let restaurant = require("./json/restaurants/" + file);
				// restaurants[restaurant.id] = restaurant;
				restaurants.push(restaurant);
			}

			// init Restaurant Model, and load restaurants data
			Restaurants.init(err => {
				if(err) return console.log("Error initialize restaurant model:", err);
				// console.log(restaurants);
				Restaurants.insertMany(restaurants, (err) => {
					if(err) return console.log("Error insert restaurants data:", err);
					console.log(`${restaurants.length}/3 restaurants added.`);

					// init User Model, and load users data
					Users.init(err => {
						if(err) return console.log("Error initialize user model:", err);
						Users.insertMany(users, (err) => {
							if(err) return console.log("Error insert users data:", err);
							console.log(`${users.length}/10 users added.\nFinished.`);

							db.close;
							process.exit(0);
						});
					});
				});
			});
		});
	});
});