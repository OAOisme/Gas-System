const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const productSchema = new Schema({
    currentprice: Number,
    totalprice: Number,
    date: {
        type: Date,
        default: Date.now,
    },
    username: String,
    branch: String,
    totalweight: Number,
    remainingstock: Number
})

const priceSchema = new Schema({
    currentprice: Number
})

const branchSchema = new Schema({
    name: String,
    currentvolume: Number,
    password: String,
    totalvolume: Number

})


const branch = mongoose.model('branch', branchSchema)
const product = mongoose.model('product', productSchema)
const price = mongoose.model('price', priceSchema)

module.exports.product = product
module.exports.price = price
module.exports.branch = branch
