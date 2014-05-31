var passport = require('passport');
var Account = require('./models/account');


function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(401);
    return res.end(JSON.stringify({'info':'this data requires login'}));
}

module.exports = function (app) {

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
        } else if((process.env['REGISTRATION_KEY'] || 'bad')=='bad'){
            return res.end(JSON.stringify({'secure':false, 'reason':'env: missing registration key'}));
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

    //mongoose local passport stuff:

    app.post('/register', function(req, res) {
        res.setHeader('Content-Type', 'application/json');

        if(!req.body.registrationKey || req.body.registrationKey != (process.env['REGISTRATION_KEY'] || 'nokey')){
            res.writeHead(401);
            return res.end(JSON.stringify({'error':'Registration Key ' + (!req.body.registrationKey ? 'required' : 'invalid')}));
        }

        Account.register(new Account({ username : req.body.username }), req.body.password, function(err, account) {
            if (err) {
                res.writeHead(400);
                return res.end(JSON.stringify({ error : err }));
            }

            passport.authenticate('local')(req, res, function () {
                res.writeHead(200);
                return res.end(JSON.stringify({ success : true }));
            });
        });
    });

    app.post('/login', function(req, res, next) {
        passport.authenticate('local', function(err, user, info) {
            if (err) { return next(err); }
            if (!user) {
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(401);
                return res.end('{"success":false, "reason":"invalid login"}');
            }
            req.logIn(user, function(err) {
                if (err) { return next(err); }
                res.setHeader('Content-Type', 'application/json');
                res.writeHead(200);
                return res.end('{"success":true}');
            });
        })(req, res, next);

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
};