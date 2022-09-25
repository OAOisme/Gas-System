const router = require("express").Router();
const addons = require('../functions'),
    { product, branch, price, stock } = require('../schema/schemas');

router.route('/login')
    .get((req, res) => {
        res.render('./pages/adminlogin')
    })
    .post((req, res) => {
        if (req.body.branch_password == "<ADMIN_PASSWORD>") {
            req.session.admin = true
            res.redirect('/admin')
        } else {
            res.redirect('/admin/login')
        }
    })


router.route('/changepassword')
    .get(addons.adminState, async (req, res) => {
        const { new_password, branch_password } = req.query
        const thebranch = await branch.findById(branch_password)
        thebranch.password = new_password;
        await thebranch.save()
        res.redirect('/admin')
    })

router.get('/addbranch', addons.adminState, async (req, res) => {
    const { branch_name, password } = req.query
    const thebranch = new branch({
        name: branch_name,
        currentvolume: 0,
        totalvolume: 0,
        password: password
    })
    await thebranch.save()
    res.redirect('/admin')
})

router.get('/changeprice', addons.adminState, async (req, res) => {
    const { price1, price50 } = req.query
    const prices = await price.find({})
    prices[0].currentprice = parseFloat(price1)
    prices[1].currentprice = parseFloat(price50)
    await prices[0].save()
    await prices[1].save()
    res.redirect('/admin')
})

router.route('/stock')
    .get(async (req, res) => {
        const branches = await branch.find({})
        const stocks = await stock.find({})
        res.render('./pages/stocks', { branches, stocks })
    })
    .post(addons.adminState, async (req, res) => {
        const { branch_name } = req.body
        const thebranch = await branch.findById(branch_name)
        const branches = await branch.find({})
        const stocks = await stock.find({ branch: thebranch.name })
        res.render('./pages/stocks', { branches, stocks })
    })


router.get('/addstock', addons.adminState,
    async (req, res) => {
        const { id, quantity } = req.query
        const branche = await branch.findById(id)
        branche.currentvolume += parseFloat(quantity)
        branche.totalvolume += parseFloat(quantity)
        await branche.save()
        const inc = await price.findById('62dea2c36e4ae8e0ee23d38f');

        //ADD TO STOCK
        const thestock = new stock({
            branch: branche.name,
            quantity: parseFloat(quantity),
            name: "ADMIN",
            date: new Date(Date.now()).toDateString()
        })

        //ADD TO PRODUCT
        const theproduct = new product({
            username: "ADMIN",
            branch: branche.name,
            totalweight: -(parseFloat(quantity)),
            inc: inc.currentprice,
            date: new Date(Date.now()).toDateString(),
            remainingstock: branche.currentvolume,
            currentprice: 0,
            totalprice: 0,
            SN: 0,
            items: [
                {
                    quantity: parseFloat(quantity),
                    price: 0
                }
            ],
            payment: "Cash"

        })
        inc.currentprice += 1
        await inc.save()
        await thestock.save()
        await theproduct.save()
        res.redirect('/admin')
    })

router.route('/sales')
    .get(addons.adminState, async (req, res) => {
        let products
        let branch_name
        if (req.query.date && req.query.branch_name) {
            branch_name = await branch.findById(req.query.branch_name)
            products = await product.find({ date: new Date(req.query.date).toDateString(), branch: branch_name.name })
        } else {
            products = []
        }

        const branches = await branch.find({})
        res.render('./pages/adminproducts', { products, branches, branch_name })
    })

router.route('/')
    .get(addons.adminState, async (req, res) => {
        const branches = await branch.find({})
        const prices = await price.find({})
        res.render('./pages/admin', { branches, prices })
    })


module.exports = router;