var createError = require('http-errors');
var express = require('express');
var path = require('path');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
var flash = require('connect-flash');
// var helmet = require('helmet');
// var routes = require('./routes');
var session = require('express-session');
var redis = require('redis');
var redisClient = redis.createClient();
var redisStore = require('connect-redis')(session);
var Promise    = require('bluebird');
Promise.promisifyAll(redis);
var app = express();

redisClient.on('error', (err) => {
  console.log('Redis error: ', err);
});


var redisInit = function() {
  console.log("in redis init")
  var client = redis.createClient(process.env.REDIS_URL);
  return client.getAsync('ready')
  .then(function() {
    console.log("in promise ")
    return Promise.resolve(client);
  });
}


/*  PASSPORT SETUP  */

// const passport = require('passport');

// require('./config/passport')(passport); // pass passport for configuration
app.use(morgan('dev'));
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(helmet());


redisInit().then(function(client) {
  console.log("in sessions init")
  var sessionMiddleware = session({
    secret: 'keyboard cat',
    resave: true,
    name: 'sessionId',
    saveUninitialized: true,
    cookie: { maxAge: 60000 },
    store: new redisStore({ host: 'localhost', port: 6379, client: redisClient, ttl: 86400 }),
  });
  app.use(sessionMiddleware);
  app.set("sessionMW", sessionMiddleware);
});
// app.use(passport.initialize());
// app.use(passport.session());
app.use(flash());



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


// // console.log(__dirname);

require('./routes/index.js')(app);
// require('./routes/users.js')(app, passport);

app.use(express.static(path.join(__dirname, '/public')));



module.exports = app;
