var path = require('path');

var express = require('express');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var Promise = require("bluebird");

var Account = require('./models/account');


function Service(){
    this.app = express();
    this.server = require('http').createServer(this.app);
}

Service.prototype.init = function(){
    var app = this.app;
    var server = this.server;

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

//        app.configure('development', function(){
//            app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
//        });
//
//        app.configure('production', function(){
//            app.use(express.errorHandler());
//        });

        // passport config
        var Account = require('./models/account');
        passport.use(new LocalStrategy(Account.authenticate()));
        passport.serializeUser(Account.serializeUser());
        passport.deserializeUser(Account.deserializeUser());

        mongoose.connect(process.env['DB_CONNECT_STRING'] || 'mongodb://localhost/civichack');

        var oneDay = 86400000;
        app.use(express.static(path.join(__dirname,  './client/')/*, { maxAge: oneDay }*/));
    });

    require('./routes')(app);

};

Service.prototype.run = function(port){
    this.server.listen(port);
};

Service.prototype.stop = function(){
    this.server.close();
};

module.exports = {
    'Service':Service
};
