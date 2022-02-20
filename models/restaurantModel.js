const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let restaurantSchema = Schema({
    name: {
        type: String,
        minLength: 1,
        required: true
    },
    min_order: {
        type: Number,
        required: true,
        min: [1, "There should be a minimum order"]
    },
    delivery_fee: {
        type: Number,
        required: true,
        min: [0, "Delivery fee cannot be negative"]
    },
    visibility: {   // visible or not to users, always visible to admin
        type: Boolean,
        default: true
    },
    menu: {
        type: Map,
        required: true
    },
    salesHistory: [{
        type: Schema.Types.ObjectId,
        ref: 'Order'
    }],
    receivedRates: [Number]
});

/*
    menu: {
        "Appetizers": [
            {
                "name": "Orc feet",
                "description": "Seasoned and grilled over an open flame.",
                "price": 5.5
            }, ...
        ], ...
    },
    salesHistory: [ObjectId, ...]
    receivedRates: [1, 2, ...]
*/



module.exports = mongoose.model("Restaurant", restaurantSchema);