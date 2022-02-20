const mongoose = require("mongoose");
const Schema = mongoose.Schema;


let userSchema = Schema({
    username: {
        type: String,
		required: true,
        unique: true,
        validate: {
            validator: function(usr) { return /^(?!.*\s).{4,20}$/.test(usr); },
            message: 'should contain 4 - 20 characters and no spaces'
        }
    },
    password: {
        type: String,
		required: true,
        validate: {
            validator: function(psw) { return /^(?!.*\s)(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,20}$/.test(psw); },
            message: 'should contain 4 - 20 characters, at least 1 digit, 1 lowercase, 1 uppercase, and no spaces'
        }
    },
    privacy: {
        type: Boolean,
        default: false
    },
    admin: {
        type: Boolean,
        default: false
    },
    orderHistory: [{
        type: Schema.Types.ObjectId,
        ref: 'Order'
    }]
});



module.exports = mongoose.model("User", userSchema);