const router = require("express").Router();
const addons = require('../functions'),
    { product, branch, price, stock } = require('../schema/schemas');

router.route('/databasepush')
    .post(async (req, res) => {
        let receive = (req.body)
        console.log(receive)
        let thebranch = await branch.findOne({ name: receive.branch })
        let inc = await price.findById("62dea2c36e4ae8e0ee23d38f")
        console.log(thebranch)
        thebranch.currentvolume -= parseFloat(receive.totalweight)
        receive.date = new Date(receive.date).toDateString()
        await thebranch.save()
        let theproduct = new product({
            username: receive.username,
            inc: inc.currentprice,
            totalweight: parseFloat(receive.totalweight),
            remainingstock: thebranch.currentvolume,
            branch: receive.branch,
            currentprice: receive.currentprice,
            totalprice: receive.totalprice,
            date: receive.date,
            SN: receive.SN,
            items: receive.items,
            payment: receive.payment
        })
        await theproduct.save()
        inc.currentprice += 1
        await inc.save()
        thebranch.SN += 1
        await thebranch.save()


        res.send('ok')
    })

module.exports = router;