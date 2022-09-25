const mongoose = require('mongoose');

// Connect to MongoDB
// SolaDola GAS
mongoose.connect('MONGO URI', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err))

// End of insert.js

const { price } = require('./schema/schemas');

const insert = async () => {
    const newPrice = new price({
        _id: '62d6b27ed3ae57e125979e7f',
        currentprice: 10
    })
    const repPrice = new price({
        _id: '62d930dcc6727b318271fe7b',
        currentprice: 10
    })
    const newPrice2 = new price({
        _id: '62dea2c36e4ae8e0ee23d38f',
        currentprice: 1
    })
    await newPrice.save()
    await repPrice.save()
    await newPrice2.save()
    console.log(newPrice)
}

insert()