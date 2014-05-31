var should = require('should');
var assert = require('assert');
var request = require('supertest');
var serviceUnderTest = require('../connection-service.js').Service;
var Promise = require("bluebird");

describe('Route Tests', function () {
    this.timeout(15 * 1000);

    var service = new serviceUnderTest();
    var port = 11080;
    var url = "http://localhost:" + port;
    var testUsername = 'testuser';
    var testUserPassword = '1234';
    var badUsername = 'dontexist';
    var badUserPassword = 'nope';
    var bannedUsername = 'banneduser';
    var bannedUserPassword = 'deservedit';

    var logInUser = function(username, password){
        username = username || testUsername;
        password = password || testUserPassword;
        return new Promise(function(resolve, reject){
            request(url)
                .post('/login')
                .send({'username':username, 'password':password})
                .set('Accept', 'application/json')
                .expect(200)
                .expect('set-cookie', /connect.sid[.]*/)
                .end(function(err, res){
                    if (err) return reject(err);
                    res.body.should.have.property('success').which.equal(true);
                    res.header.should.have.property('set-cookie');
                    var cookie = res.header['set-cookie'][0];
                    cookie = cookie.substr(0,cookie.indexOf(';'));
                    return resolve(cookie);
                });
        });
    };

    var logInUserExpectingFailure = function(username, password, expectedMessage, expectedBody){
        return new Promise(function(resolve, reject){
            request(url)
                .post('/login')
                .send({'username':username, 'password':password})
                .set('Accept', 'application/json')
                .expect(401)
                .end(function(err, res){
                    if (err) return reject(err);
                    if(!!expectedMessage){
                        res.body.should.have.property('message').which.equal(expectedMessage);
                    }
                    if(!!expectedBody){
                        res.body.should.eql(expectedBody);
                    }
                    return resolve(res.body);
                });
        });
    };

    var logOutUser = function(cookie){
        return new Promise(function(resolve, reject){
            request(url)
                .get('/logout')
                .send({'username':testUsername, 'password':testUserPassword})
                .set('Accept', 'application/json')
                .set('Cookie', cookie)
                .expect(200)
                .end(function(err, res){
                    if (err) return reject(err);
                    res.body.should.have.property('success').which.equal(true);
                    return resolve(cookie);
                });
        });
    };

    var verifyAccessIsAuthorized = function(cookie){
        return new Promise(function(resolve, reject){
            return request(url)
                .get('/authonly')
                .set('Accept', 'application/json')
                .set('Cookie', cookie)
                .expect(200)
                .end(function(err, res){
                    if (err) return reject(err);
                    res.body.should.have.property('exclusive').which.equal('user data only!');
                    return resolve(cookie);
                });
        });
    };

    var verifyAccessIsNotAuthorized = function(){
        return new Promise(function(resolve, reject){
            return request(url)
                .get('/authonly')
                .set('Accept', 'application/json')
                .expect(401)
                .end(function(err, res){
                    if (err) return reject(err);
                    res.body.should.have.property('info').which.equal('this data requires login');
                    return resolve();
                });
        });
    };

    process.env['SESSION_KEY_SECRET'] = "not so secret";

    before(function(done) {
        service.init();
        service.addUser(testUsername, testUserPassword, false);
        service.addUser(bannedUsername, bannedUserPassword, true);
        service.run(port);
        done();
    });

    after(function(done) {
        service.stop();
        done();
    });

    it('should give null user when not logged in', function(done) {

        request(url)
            .get('/user')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res){
                if (err) return done(err);
                res.body.should.have.property('username');
                assert.equal(res.body['username'], null, 'username should be null' );
                return done();
            });
    });

    it('should not send auth-only data when user not logged in', function(done){
        verifyAccessIsNotAuthorized()
        .then(done)
        .catch(done);
    });

    it('should be log in and send cookie for valid credentials', function(done){
        logInUser()
        .then(function(){done();})
        .catch(done);
    });

    it('should send auth only data when user logged in', function(done){
        logInUser()
        .then(verifyAccessIsAuthorized)
        .then(function(){done();})
        .catch(done);
    });

    it('should delete session and logout when requested', function(done){
        logInUser()
        .then(verifyAccessIsAuthorized)
        .then(logOutUser)
        .then(verifyAccessIsNotAuthorized)
        .then(done)
        .catch(done);
    });

    it('should not log in banned credentials', function(done){
        logInUserExpectingFailure(bannedUsername, bannedUserPassword, "This username has been banned")
        .then(function(){done();})
        .catch(done);
    });

    it('should not log in credentials with wrong password', function(done){
        logInUserExpectingFailure(testUsername, badUserPassword, "Invalid login")
        .then(function(){done();})
        .catch(done);
    });

    it('should not log in credentials with invalid username', function(done){
        logInUserExpectingFailure(badUsername, testUserPassword, "Invalid login")
        .then(function(){done();})
        .catch(done);
    });

    it('should send same response regardless of which part of credentials was wrong', function(done){
        logInUserExpectingFailure(testUsername, badUserPassword)
        .then(function(badPasswordBody){
            return logInUserExpectingFailure(badUsername, testUserPassword, null, badPasswordBody);
        })
        .then(function(){done();})
        .catch(done);
    });
});
