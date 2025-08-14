const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const passport = require('passport');
const session = require('express-session');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser')
const LocalStrategy = require('passport-local').Strategy;
const register = require('./localswap/schemaregister');
const PORT = 3000;
const joi = require('joi');
const Offer = require('./localswap/offers');
const OfferSchema = require('./localswap/offers');
const dashboard = require('dashboard');


mongoose.connect('mongodb://localhost:27017/localswap', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'localswap'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'lucasflomuller',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/open', async (req, res) => {
    res.render('open')
});

passport.use(new LocalStrategy(
    async (username, password, done) => {
        try {
            const User = await register.findOne({ username });
            if (!User) {
                return done(null, false, { message: 'Incorrect username or password.' });
            }
            const valid = await bcrypt.compare(password, User.password);
            if (!valid) {
                return done(null, false, { message: 'Incorrect username or password.' });
            }
            return done(null, User);
        } catch (err) {
            return done(err);
        }
    }
));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const User = await register.findById(id);
        done(null, User);
    } catch (err) {
        done(err);
    }
});

app.get('/register', async (req, res) => {
    res.render('register')
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/open',
}));


app.post('/register', async (req, res) => {
    const { email, username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new register({
            email,
            username,
            password: hashedPassword
        });
        await newUser.save()
        console.log('User Registered Successfully!');
        return res.redirect('/dashboard');
    } catch (err) {
        console.error('Error registering user');
        res.send('Error registering user');
    }
});

const proposalSchema = joi.object({
    product: joi.string().required(),
    description: joi.string().required(),
    value: joi.number().min(0).required(),
    imageURL: joi.string().uri().required(),
    location: joi.string().required(),
    owner: joi.string().required(),
    category: joi.string().valid('Item', 'Service').required(),
    status: joi.string().valid('open', 'closed').required()
});

app.post('/proposal', async (req, res) => {
    const { error } = proposalSchema.validate(req.body);
    if (error) {
        console.error(error);
        return res.send('Invalid proposal');
    }
    const { product, description, value, imageURL, location, owner, category, status } = req.body;
    try {
        const newOffer = new Offer({
            title: product,
            description,
            value,
            imageUrl: imageURL,
            location,
            owner,
            category,
            status
        });
        await newOffer.save();
        console.log('Offer Created Successfully!');
        res.send('Offer Created Successfully!');
    } catch (err) {
        console.error('Error creating offer');
        res.send('Error creating offer');
    }
});

app.get('/dashboard', (req, res) => {
   if (!req.isAuthenticated()) {
        return res.redirect('/open');
    }
    res.render('dashboard');
});

app.listen(PORT, () => {
    console.log('HELLOOO')
})

