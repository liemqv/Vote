'use strict';
const
  log = require('npmlog'),
  json = require('express-json'),
  express = require('express'),
  session = require('express-session'),
  cookieParser = require('cookie-parser'),
  morgan = require('morgan'),
  passport = require('passport'),
  request = require('request'),
  redisClient = require('redis').createClient(18164, 'pub-redis-18164.ap-northeast-1-2.1.ec2.garantiadata.com', {}),
  RedisStore = require('connect-redis')(session),
  GoogleStrategy = require('passport-google').Strategy,
  Vote = require('./model/Vote.js'),
  User = require('./model/User.js'),
  config = {
    datadb: 'https://liemqv.iriscouch.com/classic-voting/'
  },
  app = express();

/* BEGIN: Redis */
redisClient.auth("classic@voting");
redisClient
  .on('ready', function() { log.info('REDIS', 'ready'); })
  .on('error', function(err) { log.error('REDIS', err.message); });
/* END: Redis */

/* BEGIN: Auth */
passport.serializeUser(function(user, done) {
  log.info('PASSPORT SER', user);
  //Insert user info to database
  User.addUser(user.identifier, user.emails[0].value, user.displayName, "", function(err, data){
    if(err) {
      log.error('WEB', 'Failed insert user: ' + err);
    } else {
      log.info('WEB', 'Success insert user');
    }
  });
  done(null, user.identifier);
});
passport.deserializeUser(function(id, done) {
  done(null, { identifier: id });
});
passport.use(new GoogleStrategy({
    returnURL: 'http://localhost:3000/auth/google/return',
    realm: 'http://localhost:3000/'
  },
  function(identifier, profile, done) {
    log.info('PASSPORT USE', profile);
    profile.identifier = identifier;
    return done(null, profile);
  }
));

const authed = function(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else if (redisClient.ready) {
    res.json(403, {
      error: "forbidden",
      reason: "not_authenticated"
    });
  } else {
    res.json(503, {
      error: "service_unavailable",
      reason: "authentication_unavailable"
    });
  }
};
/* END: Auth */

app.use(morgan('dev'));
app.use(cookieParser());
app.use(session({
  secret: 'unguessable',
  store: new RedisStore({
    client: redisClient
  }),
  resave: true,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/static'));
app.use(express.static(__dirname + '/bower_components'));

/* BEGIN: Process request */

app.get('/api/user', authed, function(req, res){
  console.log(req.user);
  res.json(req.user);
});

app.get('/api/hello/:name', function(req, res) {
  res.json(200, { "hello": req.params.name });
});

app.get('/auth/google/:return?',
  passport.authenticate('google', { successRedirect: '/' })
);
app.get('/auth/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/api/vote/', authed, function(req, res) {
  log.info('WEB - USER', req.user);
  Vote.getAllVote(function(err, votes){
    if (err) {
      res.json(502, { error: "bad_gateway", reason: err.code });
    } else {
      res.send(200, votes);
    }
  });
});

app.get('/api/vote/id/:id', authed, function(req, res) {
  Vote.getVote(req.params.id, function(err, vote){
    if (err) {
      res.json(502, { error: "bad_gateway", reason: err.code });
    } else {
      res.send(200, vote);
    }
  });
});

app.put('/api/user/bundles', [authed, json()], function(req, res) {
  let userURL = config.datadb + encodeURIComponent(req.user.identifier);
  log.info('AUTH', 'PUT ' + userURL);
  request(userURL, function(err, couchRes, body) {
    if (err) {
      res.json(502, { error: "bad_gateway", reason: err.code });
    } else if (couchRes.statusCode === 200) {
      let user = JSON.parse(body);
      user.bundles = req.body;
      request.put({ url: userURL, json: user }).pipe(res);
    } else if (couchRes.statusCode === 404) {
      let user = { bundles: req.body };
      request.put({ url: userURL,  json: user }).pipe(res);
    } else {
      res.send(couchRes.statusCode, body);
    }
  });
});

/* END: Process request */
var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log("I'm ready on port "+ port +"...");
});