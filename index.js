const express = require('express'),
    app = express(),
    mongoose = require('mongoose'),
    addons = require('./functions'),
    session = require('express-session'),
    engine = require('ejs-mate'),
    path = require('path'),
    { product, branch, price, dayTotal } = require('./schema/schemas')


require('dotenv').config()
// Connect to MongoDB
mongoose.connect('mongodb+srv://oaoisme:jk4dsi6t!@aboundgas.mh8lctb.mongodb.net/?retryWrites=true&w=majority')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err))

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.engine('ejs', engine)
app.use(express.static(path.join(__dirname, 'public')))

app.set('trust proxy', 1)
app.use(session({
    secret: 'NOTYOURBUSINESS',
    resave: false,
    saveUninitialized: true,
    //cookie: { secure: true }
}))



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
    })

app.route('/delete/:id')
    .get(async (req, res) => {
        const { id } = req.params
        const prod = await product.findById(id)
        await product.updateMany({ inc: { $gt: prod.inc }, branch: prod.branch }, { $inc: { remainingstock: (parseInt(prod.totalweight)) } })
        const thebranch = await branch.findOne({ name: prod.branch })
        thebranch.currentvolume += parseInt(prod.totalweight)
        thebranch.save()
        await product.findByIdAndDelete(id)
        res.redirect('/admin')

    })

app.route('/admin')
    .get(async (req, res) => {
        const branches = await branch.find({})
        const prices = await price.find({})
        res.render('./pages/admin', { branches, prices })
    })

app.route('/admin/changepassword')
    .get(async (req, res) => {
        const { new_password, branch_password } = req.query
        const thebranch = await branch.findById(branch_password)
        thebranch.password = new_password;
        await thebranch.save()
        res.redirect('/admin')
    })

app.get('/admin/addbranch', async (req, res) => {
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

app.get('/admin/changeprice', async (req, res) => {
    const { price1, price50 } = req.query
    const prices = await price.find({})
    prices[0].currentprice = parseInt(price1)
    prices[1].currentprice = parseInt(price50)
    await prices[0].save()
    await prices[1].save()
    res.redirect('/admin')
})

app.get('/admin/addstock',
    async (req, res) => {
        const { id, quantity } = req.query
        const branche = await branch.findById(id)
        branche.currentvolume += parseInt(quantity)
        branche.totalvolume += parseInt(quantity)
        await branche.save()
        res.redirect('/admin')
    })

app.route('/admin/sales')
    .get(async (req, res) => {
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

app.route('/finish')
    .get(addons.isLoggedIn, async (req, res) => {
        const { total, weight, paid, payment } = req.query
        let dates = new Date(Date.now()).toDateString()
        req.session.receipt = { total, weight, paid, date: dates, name: req.session.username, branch_name: req.session.branch_name, payment }
        res.redirect('/receipt')
    })

app.route('/receipt')
    .get(addons.isLoggedIn, async (req, res) => {
        if (req.session.receipt) {
            const { total, weight, paid, date, name, branch_name, payment } = req.session.receipt
            const inc = await price.findById('62dea2c36e4ae8e0ee23d38f')
            const currentbranch = await branch.findOne({ name: branch_name })
            if (weight <= currentbranch.currentvolume) {
                currentbranch.currentvolume -= parseInt(weight)
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
                    payment: payment
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
                    newDay.openingStock = (parseInt(newProduct.remainingstock) + parseInt(newProduct.totalweight))
                    const previousDate = new Date(newDay.date) - (24 * 60 * 60 * 1000)
                    const previousDay = await dayTotal.find({ branch: currentbranch.name, date: previousDate })
                    if (previousDay.length) {

                        previousDay[0].closingStock = newDay.openingStock
                        previousDay[0].save()
                    }
                    newDay.save()
                }
                res.render('./pages/receipt', { receipt })
            } else {
                res.redirect('/')
            }
        } else {
            res.redirect('/')
        }
    })

app.route('/sales')
    .get(addons.isLoggedIn, async (req, res) => {
        let products
        if (req.query.date) {
            products = await product.find({ date: new Date(req.query.date).toDateString(), branch: req.session.branch })
        } else {
            products = await product.find({ date: new Date(Date.now()).toDateString(), branch: req.session.branch })
        }
        const branche = await branch.findOne({ name: req.session.branch })
        res.render('./pages/products', { products, branche })
    })

app.get('/addall', async (req, res) => {
    await product.updateMany({ inc: { $gt: 1 } }, { $inc: { remainingstock: 1 } })
    res.redirect('/')
})

app.route('/')
    .get(addons.isLoggedIn, async (req, res) => {


        req.session.price = await addons.getCurrerntPrice()
        req.session.price50 = await addons.getCurrerntPrice50()
        const { username, branch_name, price, price50 } = req.session
        const actual_branch = await branch.findOne({ name: branch_name })
        res.render('./pages/index', { username, branch_name, price, price50, branchStock: actual_branch.currentvolume })

    })

app.listen(process.env.PORT || 3000, () => {
    console.log('Server is running on port 3000')
}   // End of app.listen    (3000)          
)