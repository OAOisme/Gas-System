const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const productSchema = new Schema({
    currentprice: Number,
    totalprice: Number,
    date: {
        type: Date,
        default: Date.now,
    },
    SN: Number,
    username: String,
    branch: String,
    totalweight: Number,
    remainingstock: Number,
    inc: {
        type: Number
    },
    payment: {
        type: String,
        enum: ["POS", "Cash", "Transfer"]
    },
    items: [
        {
            quantity: Number,
            price: Number,
            _id: false
        }
    ]
})

const priceSchema = new Schema({
    currentprice: Number
})

const dayTotalSchema = new Schema({
    date: Date,
    openingStock: Number,
    closingStock: Number,
    branch: String
})

const branchSchema = new Schema({
    name: String,
    currentvolume: Number,
    password: String,
    totalvolume: Number,
    SN:
    {
        type: Number,
        default: 1
    }

})



module.exports.dayTotal = mongoose.model('dayTotal', dayTotalSchema)
module.exports.product = mongoose.model('product', productSchema)
module.exports.price = mongoose.model('price', priceSchema)
module.exports.branch = mongoose.model('branch', branchSchema)
