const app = require("express").Router(),
    addons = require('../functions'),
    { product, branch, price, dayTotal } = require('../schema/schemas');

app.get('/logout', (req, res) => {
    req.session = null
    res.redirect('/login')
})


app.route('/login')
    .get(async (_req, res) => {
        const branches = await branch.find({})
        res.render('./pages/login', { branches })
    })
    .post(async (req, res) => {
        try {
            const { username, branch_name, branch_password } = req.body
            const actual_branch = await branch.findOne({ name: branch_name })
            if (actual_branch.password != branch_password) {
                res.redirect('/login')
            }
            else {
                req.session.username = username
                req.session.branch_name = branch_name
                res.redirect('/')
            }
        } catch (err) {
            res.redirect('/login')
        }
    })



app.route('/delete/:id')
    .get(addons.adminState, async (req, res) => {
        try {
            const { id } = req.params
            const prod = await product.findById(id)
            await product.updateMany({ inc: { $gt: prod.inc }, branch: prod.branch }, { $inc: { remainingstock: (parseFloat(prod.totalweight)) } })
            const thebranch = await branch.findOne({ name: prod.branch })
            thebranch.currentvolume += parseFloat(prod.totalweight)
            thebranch.save()
            await product.findByIdAndDelete(id)
            res.redirect('/admin')
        } catch (error) {
            res.redirect('/admin')
        }

    })


app.post('/purchase', addons.isLoggedIn, async (req, res) => {
    try {
        let products = []
        const arr = req.body.product
        for (let i = 0; i < arr.length; i += 2) {
            let cop = {
                quantity: parseFloat(arr[i]),
                price: parseFloat(arr[i + 1])
            }
            products.push(cop)
        }
        req.session.query = req.body
        req.session.items = products
        res.redirect('/finish');
    } catch (err) {
        res.redirect('/')
    }
})


app.route('/finish')
    .get(addons.isLoggedIn, async (req, res) => {
        try {
            const { total, weight, paid, payment } = req.session.query
            let dates = new Date(Date.now()).toDateString()
            req.session.receipt = { total, weight, paid, date: dates, name: req.session.username, branch_name: req.session.branch_name, payment }
            res.redirect('/receipt')
        } catch (err) {
            res.redirect('/')
        }
    })

app.route('/receipt')
    .get(addons.isLoggedIn, async (req, res) => {
        try {
            if (req.session.receipt) {
                const { total, weight, paid, date, name, branch_name, payment } = req.session.receipt
                const inc = await price.findById('62dea2c36e4ae8e0ee23d38f')
                const currentbranch = await branch.findOne({ name: branch_name })
                if (weight <= currentbranch.currentvolume) {
                    currentbranch.currentvolume -= parseFloat(weight);
                    currentbranch.SN += 1;
                    await currentbranch.save()
                    const receipt = req.session.receipt
                    req.session.receipt = null
                    const newProduct = new product({
                        currentprice: req.session.price,
                        totalprice: total,
                        date: date,
                        username: name,
                        branch: branch_name,
                        totalweight: weight,
                        remainingstock: currentbranch.currentvolume,
                        inc: inc.currentprice,
                        payment: payment,
                        SN: currentbranch.SN,
                        items: req.session.items
                    })
                    inc.currentprice++
                    inc.save()
                    newProduct.save()
                    const day = await dayTotal.find({ branch: currentbranch.name, date: newProduct.date })
                    if (!day.length) {
                        const newDay = new dayTotal({
                            date: newProduct.date,
                            branch: newProduct.branch
                        })
                        newDay.openingStock = (parseFloat(newProduct.remainingstock) + parseFloat(newProduct.totalweight))
                        const previousDate = new Date(newDay.date) - (24 * 60 * 60 * 1000)
                        const previousDay = await dayTotal.find({ branch: currentbranch.name, date: previousDate })
                        if (previousDay.length) {

                            previousDay[0].closingStock = newDay.openingStock
                            previousDay[0].save()
                        }
                        newDay.save()
                    }
                    res.render('./pages/receipt', { receipt, SN: currentbranch.SN })
                } else {
                    res.redirect('/')
                }
            } else {
                res.redirect('/')
            }
        } catch (e) {
            res.redirect('/')
        }
    })

app.route('/sales')
    .get(addons.isLoggedIn, async (req, res) => {
        try {
            let products
            if (req.query.date) {
                products = await product.find({ date: new Date(req.query.date).toDateString(), branch: req.session.branch_name })
            } else {
                products = await product.find({ date: new Date(Date.now()).toDateString(), branch: req.session.branch_name })
            }
            const branche = await branch.findOne({ name: req.session.branch })
            res.render('./pages/products', { products, branche })
        } catch (e) {
            res.redirect('/')
        }
    })

app.get('/addall', async (req, res) => {
    try {
        await product.updateMany({ inc: { $gt: 1 } }, { $inc: { remainingstock: 1 } })
        res.redirect('/')
    } catch (e) {
        res.redirect('/')
    }
})

app.route('/')
    .get(addons.isLoggedIn, async (req, res) => {
        try {
            req.session.price = await addons.getCurrerntPrice()
            req.session.price50 = await addons.getCurrerntPrice50()
            const { username, branch_name, price, price50 } = req.session
            const actual_branch = await branch.findOne({ name: branch_name })
            res.render('./pages/index', { username, branch_name, price, price50, branchStock: actual_branch.currentvolume })
        } catch (e) {
            res.redirect('/')
        }

    })


module.exports = app;
