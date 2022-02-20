const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let orderSchema = Schema({
    userID: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    restaurantID: {
        type: Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    subtotal: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    fee: {
        type: Number,
        required: true
    },
    tax: {
        type: Number,
        required: true
    },
    order: {
        type: Object,
        required: true
    },
    rate: {
        type: Number,
        min: 1,
        max: 5
    }
});

/*
    userID: {Mongo ObjectId},
    restaurantID: {Mongo ObjectId},
    subtotal: 31.5,
    total: 39.65,
    fee: 5,
    tax: 3.15,
    order: {
        "Sauron's Lava Soup": 2, "Eowyn's (In)Famous Stew": 4, "The 9 rings of men": 1, ...
    },
    rate: 5
*/



module.exports = mongoose.model("Order", orderSchema);