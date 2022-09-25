const express = require('express'),
    app = express(),
    mongoose = require('mongoose'),
    session = require('express-session'),
    engine = require('ejs-mate'),
    path = require('path'),
    admin = require('./routes/admin'),
    main = require('./routes/main'),
    outsidedata = require('./routes/outsidedata');


    /*
    RUN INSERT.JS BEFORE RUNNING THE SERVER
    */


require('dotenv').config()
mongoose.connect("MONGO URI")
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err))

app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.engine('ejs', engine)
app.use(express.static(path.join(__dirname, 'public')))

app.set('trust proxy', 1)
app.use(session({
    secret: 'NOTYOURBUSINESS',
    resave: false,
    saveUninitialized: true,
    //cookie: { secure: true }
}))

app.use('/admin', admin)
app.use('/', main)
app.use('/', outsidedata)

app.listen(process.env.PORT || 3000, () => {
    console.log('Server is running on port 3000')
}   // End of app.listen    (3000)          
)