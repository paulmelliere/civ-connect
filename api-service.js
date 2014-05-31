var express = require('express');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var Promise = require("bluebird");
var path = require('path');
var users = require('./users').users;

function findById(id, fn) {
    var idx = id - 1;
    if (users[idx]) {
        fn(null, users[idx]);
    } else {
        fn(new Error('User ' + id + ' does not exist'));
    }
}

function findByUsername(username, fn) {
    console.log("trying to find user: " + username);
    for (var i = 0, len = users.length; i < len; i++) {
        var user = users[i];
        if (user.username === username) {
            return fn(null, user);
        }
    }
    return fn(null, null);
}

function Service(){
    this.app = express();
    this.server = require('http').createServer(this.app);
    this.io = require('socket.io').listen(this.server);
}

Service.prototype.init = function(){
    var app = this.app;
    var server = this.server;
    var io = this.io;

    //setup passport
    passport.use(new LocalStrategy(
        function(username, password, done) {
            process.nextTick(function () {

                // Find the user by username.  If there is no user with the given
                // username, or the password is not correct, set the user to `false` to
                // indicate failure and set a flash message.  Otherwise, return the
                // authenticated `user`.
                findByUsername(username, function(err, user) {
                    if (err) { return done(err); }
                    if (!user || user.password != password) { return done(null, false, { message: 'Invalid login' }); }
                    console.log("FOUND USER:" + JSON.stringify(user));
                    if (!!user.banned){ return done(null, false, {message: 'This username has been banned'}); }
                    return done(null, user);
                });
            });
        }
    ));

    passport.serializeUser(function(user, done) {
        if(!!user){
            return done(null, user.id);
        }
        return done(null, null);
    });

    passport.deserializeUser(function(id, done) {
        findById(id, function(err, user) {
            done(err, user);
        });
    });

    function ensureAuthenticated(req, res, next) {
        if (req.isAuthenticated()) { return next(); }
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(401);
        return res.end(JSON.stringify({'info':'this data requires login'}));
    }

    var sessionStore = null;

    app.configure(function() {
        //set up compression
        app.use(express.compress());

        //Use logger
        //app.use(express.logger());

        app.use(express.cookieParser());
        app.use(express.bodyParser());

        //enable put/delete simulation
        app.use(express.methodOverride());

        //enable sessions with secret key & keep track of session store
        sessionStore = new express.session.MemoryStore(); //TODO: Not recommended for production use
        app.sessionStore = sessionStore;
        app.use(express.session({
            'key': 'connect.sid',
            'store': sessionStore,
            'cookie': {'path': '/', 'httpOnly': true, maxAge: 60 * 60 * 1000},
            'secret': process.env['SESSION_KEY_SECRET'] || 'notsosecret'
        }) );

        //setup passport
        app.use(passport.initialize());
        app.use(passport.session());

        var oneDay = 86400000;
        app.use(express.static(path.join(__dirname,  './client/')/*, { maxAge: oneDay }*/));
    });

    app.post('/login',
        function(req, res, next) {
            console.log("login was called");
            passport.authenticate('local', function(err, user, info) {
                console.log("auth was called with user: " + JSON.stringify(user) + " err:" + err + " info:" + JSON.stringify(info));
                if (err) { return next(err) }
                if (!user) {
                    req.session.messages =  [info.message];
                    res.setHeader('Content-Type', 'application/json');
                    res.writeHead(401);
                    return res.end(JSON.stringify(info));
                    //return res.redirect('/#login')
                }
                req.logIn(user, function(err) {
                    if (err) { return next(err); }
                    res.setHeader('Content-Type', 'application/json');
                    res.writeHead(200);
                    return res.end(JSON.stringify({'success':true}));
                });
            })(req, res, next);
        }
    );

    app.get('/authonly',ensureAuthenticated,function(req, res){
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        return res.end(JSON.stringify({'exclusive':'user data only!'}));
    });

    app.get('/secured',ensureAuthenticated, function(req, res){
        res.setHeader('Content-Type', 'application');
        res.writeHead(200);
        if((process.env['SESSION_KEY_SECRET'] || 'bad')=='bad'){
            return res.end(JSON.stringify({'secure':false, 'reason':'env: missing session key'}));
        }

        return res.end(JSON.stringify({'secure':true}));
    });

    app.get('/user', function(req, res){
        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);

        if (req.isAuthenticated()) {
            return res.end(JSON.stringify({'username':req.user.username}));
        }

        return res.end(JSON.stringify({'username':null}));
    });

    app.get('/logout', function(req, res){
        try{
            req.logout();
        }catch(err){
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(500);
            return res.end(JSON.stringify(err));
        }

        res.setHeader('Content-Type', 'application/json');
        res.writeHead(200);
        return res.end(JSON.stringify({'success':true}));
    });



    io.configure(function () {
        io.set('authorization', function (handshakeData, callback) {
            console.log("!!!! IO AUTHORIZATION STUFF!!!");

            var cookie = handshakeData.headers.cookie;

            if(!cookie){
                return callback(new Error("No cookie transmitted"), false);
            }
            var unparsedCookies = cookie.split(';');
            var cookies = {};
            for(var i =0;i<unparsedCookies.length;i++){
                var e = unparsedCookies[i].split('=');
                cookies[e[0]]=e[1];
            }

            handshakeData.cookie = cookies;
            console.log(handshakeData.cookie);
            handshakeData.sessionId = handshakeData.cookie['connect.sid'];

            if(!handshakeData.sessionId){
                return callback(new Error("Cookie had no session id"), false);
            }

            return sessionStore.get(handshakeData.sessionId, function(err, session){
                if(err){
                    return callback(err, false);
                }
                handshakeData.session = session; //Accept the session
                return callback(null, true);
            });

        });

//        io.on('connection', function(socket) {
//            // reference to my initialized sessionStore in app.js
//            var sessionStore = config.sessionStore;
//            var sessionId    = socket.handshake.sessionId;
//
//            sessionStore.get(sessionId, function(err, session) {
//                if( ! err) {
//                    if(session.passport.user) {
//                        console.log('This is the users email address %s', session.passport.user);
//                    }
//                }});
//        });
    });

    //io.sockets.on
    var messageBus;
    messageBus = io.of('/websocket').on('connection', function (socket) {
        socket.emit('a message', {
            that: 'only'
            , '/chat': 'will get'
        });
        messageBus.emit('a message', {
            everyone: 'in'
            , '/chat': 'will get'
        });

        socket.on('message', function(data){

        });
        socket.on('disconnect', function(){
            console.log('disconnect detected')
        });
    });

};

Service.prototype.run = function(port){
    this.server.listen(port);
};

Service.prototype.stop = function(){
    this.server.close();
};

Service.prototype.addUser = function(username, password, banned){
    var index = users.length;
    users.push({ 'id': index, 'username': username, 'password': password, email: username + '@example.com', 'banned':banned });
};

Service.prototype.setUserBan = function(username, banned){
    for (var i = 0, len = users.length; i < len; i++) {
        var user = users[i];
        if (user.username === username) {
            user.banned=banned;
            return;
        }
    }
};

module.exports = {
    'Service':Service
};
