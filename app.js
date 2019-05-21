var createError = require('http-errors');
var express = require('express');
var path = require('path');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
var flash = require('connect-flash');
var session = require('express-session');
var MemoryStore = require('memorystore')(session)
var store = new MemoryStore();

// var redis = require('redis');
// var redisClient = redis.createClient();
// var redisStore = require('connect-redis')(session);

var app = express();
app.set('store' , store);
// redisClient.on('error', (err) => {
//   console.log('Redis error: ', err);
// });

/*  PASSPORT SETUP  */

// const passport = require('passport');

// require('./config/passport')(passport); // pass passport for configuration
app.use(morgan('dev'));
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(helmet());

var sessionMiddleware = session({
  key: 'express.sid',
  resave: true,
  // name: 'sessionId',
  saveUninitialized: true,
  cookie: { maxAge: 60000 },
  store:store
  // store: new redisStore({ host: '5.39.80.142', port: 6379, client: redisClient, ttl: 86400 }),
});
app.use(sessionMiddleware);
app.set("sessionMW", sessionMiddleware);
// app.use(passport.initialize());
// app.use(passport.session());
app.use(flash());



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));



app.use(express.static(path.join(__dirname, '/public')));



module.exports = app;
