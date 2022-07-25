const mongoose = require('mongoose');

const { price } = require('./schema/schemas')


const changePrice = (value) => {
    price.findOneAndUpdate({ _id: '62d6b27ed3ae57e125979e7f' }, { currentprice: value })
        .then(pri => console.log(pri))
        .catch(err => console.log(err))
}

const createPrice = (value) => {
    const newPrice = new price({ currentprice: value })
    newPrice.save()
        .then(pri => console.log(pri))
        .catch(err => console.log(err))
}

const getCurrerntPrice = async () => {
    const currentprice = await price.findOne({ _id: '62d6b27ed3ae57e125979e7f' })
    return currentprice.currentprice

}
const getCurrerntPrice50 = async () => {
    const currentprice = await price.findOne({ _id: '62d930dcc6727b318271fe7b' })
    return currentprice.currentprice

}



const isLoggedIn = async (req, res, next) => {
    if (req.session.username) {
        next()
    } else {
        res.redirect('/login')
    }
}

const adminState = async (req, res, next) => {
    if (req.session.admin) {
        next()
    } else {
        res.redirect('/admin/login')
    }
}
module.exports = { changePrice, createPrice, getCurrerntPrice, isLoggedIn, getCurrerntPrice50 };


