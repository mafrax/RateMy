var createError = require('http-errors');
var express = require('express');
var cookieParser = require('cookie-parser');

var path = require('path');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var logger = require('morgan');
var flash = require('connect-flash');
var session = require('express-session');
var MemoryStore = require('memorystore')(session)
var store = new MemoryStore();
var cron = require("node-cron");
var crawler = require('./models/crawl')
/**
 * Module dependencies.
 */

var debug = require('debug')('testserver:server');
var http = require('http');
var sharedsession = require("express-socket.io-session");
var cookie = require('cookie');

var Session = require('connect');
// var redis = require('redis');
// var redisClient = redis.createClient();
// var redisStore = require('connect-redis')(session);

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var dotenv = require('dotenv')

app.use(cookieParser());
app.set('store' , store);
app.set('cookieParser', cookieParser);
// redisClient.on('error', (err) => {
//   console.log('Redis error: ', err);
// });



if (process.env.NODE_ENV === 'production') {
  dotenv.config()
}
console.log(process.env.PORT)

const passport = require('passport');

// require('./config/passport')(passport); // pass passport for configuration
app.use(morgan('dev'));
 // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));
// app.use(helmet());

var sessionMiddleware = session({
  secret: 'keyboard cat',
  // key: 'express.sid',
  resave: true,
  name: 'sessionId',
  saveUninitialized: true,
  cookie: { maxAge: 6000000 },
  store:store
  // store: new redisStore({ host: '5.39.80.142', port: 6379, client: redisClient, ttl: 86400 }),
});
app.use(sessionMiddleware);
io.use(sharedsession(sessionMiddleware, {
  autoSave:true}));
// app.set("sessionMW", sessionMiddleware);
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


/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

var handler = require('./models/serverEvents')(io);


require('./routes/index.js')(app);

//server is 2hours ealier than paris time 
cron.schedule("00 10 * * *", function() {
  console.log(new Date().toISOString())
  crawler.dailyCrawl(function(){
      console.log("truc2" + Date.now());
    });
});




/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);


/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

