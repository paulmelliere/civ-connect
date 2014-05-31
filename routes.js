var passport = require('passport');

var Account = require('./models/account');
var Report = require('./models/report');
var ReportType = require('./models/reporttype');


function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(401);
    return res.end(JSON.stringify({'info':'this data requires login'}));
}

function successWithJson(res, json){
    json = json || {'success':true};
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    //return res.end(JSON.stringify(json));
    console.log(json);
    return res.end(JSON.stringify(json));
}

function requestFailureWithJson(res, err){
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(400);
    return res.end(JSON.stringify(err));
}

function serverFailureWithJson(res, err){
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(500);
    return res.end(JSON.stringify(err));
}

module.exports = function (app, mongoose) {

    function verifyDbConnected(req, res, next){
        if(mongoose.connection.readyState===1){return next();}//ready

        res.setHeader('Content-Type', 'application/json');
        res.writeHead(500);
        return res.end(JSON.stringify({'info':'app has no connection to database', 'status':mongoose.connection.readyState}));
    }

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

    app.get('/username', function(req, res){
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
                return res.end('{"success":false, "info":"invalid login"}');
            }

            req.logIn(user, function(err) {
                if (err) { return next(err); }
                return successWithJson(res)
            });
        })(req, res, next);

    });

    app.get('/logout', function(req, res){
        try{
            req.logout();
        }catch(err){
            return serverFailureWithJson(res, err)
        }

        return successWithJson(req)
    });

    //privilegedApi:

    app.get('/users', ensureAuthenticated, function(req, res){
        Account.find({}).exec(function(err, results){
            if(err) return requestFailureWithJson(res, err);
            return successWithJson(res, results.map(function(user){return {'username':user.username, 'id':user.id}}));
        });
    });

    app.get('/users/:id', ensureAuthenticated, function(req, res){
        console.log("looking for user with id ");
        console.log(req.params.id);
        Account.find({'_id':req.params.id}).exec(function(err, results){
            if(err) return requestFailureWithJson(res, err);
            return successWithJson(res, results.map(function(user){return {'username':user.username, 'id':user.id}}));
        });
    });

    app.get('/reports', ensureAuthenticated, function(req, res){
        Report.find({}).exec(function(err, results){
            if(err) return requestFailureWithJson(res, err);
            return successWithJson(res, results);
        });
    });

    app.post('/reports', ensureAuthenticated, verifyDbConnected, function(req, res){
        var newReport = req.body;
        newReport.reporterId = req.user._id;
        newReport.timestamp = Date.now();
        console.log("trying to add report: " + JSON.stringify(newReport));

        ReportType.find({_id:req.body.type}).exec(function(err, reporttype){
            console.log("looking up report type yielded:" + JSON.stringify(err) + " | " + JSON.stringify(reporttype));
            if(!err && reporttype.length > 0) {
                newReport.typeName = reporttype[0].name;
            }

            var report = new Report(newReport);

            report.save(function (err, report) {
                if (err) return requestFailureWithJson(req, err);
                return successWithJson(res, report)
            });
        });


    });

    app.get('/reports/:id', ensureAuthenticated, verifyDbConnected, function(req, res){
        Report.find({_id:req.params.id}).exec(function(err, results){
            if(err) return requestFailureWithJson(res, err);
            return successWithJson(res, results);
        });
    });


    app.get('/reporttypes', ensureAuthenticated, function(req, res){
        ReportType.find({}).exec(function(err, results){
            if(err) return requestFailureWithJson(res, err);
            return successWithJson(res, results);
        });
    });

    app.post('/reporttypes', ensureAuthenticated, verifyDbConnected, function(req, res){
        var newReportType = req.body;
        var reportType = new ReportType(newReportType);

        reportType.save(function (err, report) {
            if (err) return requestFailureWithJson(req, err);
            return successWithJson(res, report)
        });
    });

    app.get('/reporttypes/:id', ensureAuthenticated, verifyDbConnected, function(req, res){
        ReportType.find({_id:req.params.id}).exec(function(err, results){
            if(err) return requestFailureWithJson(res, err);
            return successWithJson(res, results);
        });
    });
};