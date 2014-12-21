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
  FacebookStrategy = require('passport-facebook').Strategy,
  Vote = require('./model/Vote.js'),
  UserModel = require('./model/User.js'),
  config = {
    datadb: 'https://liemqv.iriscouch.com/classic-voting/'
  },
  host = {
    live: 'https://classic-vote.herokuapp.com',
    dev: 'http://localhost:3000'
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
  done(null, user.identifier);
});

passport.deserializeUser(function(id, done) {
  done(null, { identifier: id });
});

passport.use(new GoogleStrategy({
    returnURL: host.live + '/auth/google/return',
    realm: host.live
  },
  function(identifier, profile, done) {
    log.info('Google profile', profile);
    profile.identifier = identifier;
    //Insert user info to database
    UserModel.addUser(profile.identifier, profile.emails[0].value, profile.displayName, "", function(err, data){
      if(err) {
        log.error('WEB', 'Failed insert user: ' + err);
      } else {
        log.info('WEB', 'Success insert user ' + profile.displayName);
      }
    });
    return done(null, profile);
  }
));

passport.use(new FacebookStrategy({
    clientID: "1446737665549121",
    clientSecret: "161759961560b1d08bce1cb8cf732c66",
    callbackURL: host.dev + "/auth/facebook/callback",
    enableProof: false
  },
  function(accessToken, refreshToken, profile, done) {
    log.info("Facebook profile", profile);
    profile.identifier = accessToken;
    //Insert user info to database
    UserModel.addUser(profile.id, profile.username, profile.displayName, profile.bio, function(err, data){
      if(err) {
        log.error('WEB', 'Failed insert user: ' + err);
      } else {
        log.info('WEB', 'Success insert user ' + profile.displayName);
      }
    });
    process.nextTick(function () {
     return done(null, profile);
   });
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
  log.info("WEB - USER", req.user);
  res.json(req.user);
});

app.get('/api/hello/:name', function(req, res) {
  res.json(200, { "hello": req.params.name });
});

app.get('/auth/google/:return?',
  passport.authenticate('google', { successRedirect: '/' })
);

// Redirect the user to Facebook for authentication.  When complete,
// Facebook will redirect the user back to the application at
//     /auth/facebook/callback
app.get('/auth/facebook', passport.authenticate('facebook', { scope: 'read_stream' }));

// Facebook will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
app.get('/auth/facebook/callback', 
  passport.authenticate('facebook', { successRedirect: '/#list-vote',
                                      failureRedirect: '/#index' }));

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

app.put('/api/vote/:id', [authed, json()], function(req, res) {
  let user_id = encodeURIComponent(req.user.identifier);
  let vote_id = req.params.id;
  if(vote_id == null || vote_id == '') {
    res.json(405, { error: "moethod_not_allowed", reason: "Method Not Allowed" });
  } else {
    Vote.addVoteItem(vote_id, {"userid": user_id}, function(err, data){
      if(err) {
        res.json(502, { error: "bad_gateway", reason: err.code });
      } else {
        res.json(200, data);
      }
    });
  }
});

/* END: Process request */
var port = process.env.PORT || 3000;
app.listen(port, function(){
  console.log("I'm ready on port "+ port +"...");
});