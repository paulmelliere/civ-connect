var should = require('should');
var assert = require('assert');
var request = require('supertest');
var io = require("socket.io-client");
var serviceUnderTest = require('../connection-service.js').Service;
var Promise = require("bluebird");

describe('Socket Tests', function () {
    this.timeout(5 * 1000);

    var service = new serviceUnderTest();
    var port = 11080;
    var url = "http://localhost:" + port;
    var testUsername = 'testuser';
    var testUserPassword = '1234';
    var badUsername = 'dontexist';
    var badUserPassword = 'nope';
    var bannedUsername = 'banneduser';
    var bannedUserPassword = 'deservedit';

    //Some monkeying around getting cookies to work with socket.io
    //original source: https://gist.github.com/jfromaniello/4087861

    var currentCookie = null;

    var originalRequest = require('xmlhttprequest').XMLHttpRequest;

    require('../node_modules/socket.io-client/node_modules/xmlhttprequest').XMLHttpRequest = function(){
        originalRequest.apply(this, arguments);
        this.setDisableHeaderCheck(true);
        var stdOpen = this.open;

        /*
         * I will patch now open in order to set my cookie from the jar request.
         */
        this.open = function() {
            stdOpen.apply(this, arguments);

            if(!!currentCookie){
                this.setRequestHeader('cookie', currentCookie);
            }
        };
    };
    //end monkeying around

    var openSocket = function(){
        return new Promise(function(resolve){
            var socket = io.connect(url+'/websocket',{ 'force new connection': true });
            resolve(socket);
        });
    };

    var logInUserAndOpenSocket = function(username, password){
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
                    if (err) return reject(err)
                    var cookie = res.header['set-cookie'][0];
                    cookie = cookie.substr(0,cookie.indexOf(';'));
                    currentCookie = cookie;

                    return resolve();
                });
        })
        .then(function(){return openSocket();})
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

    it('should deny access to websocket if not logged in', function(done){
        openSocket()
            .then(function verifyAccessIsDenied(messageBus){
                messageBus.on('connect', function () {
                    done(new Error("Should not have connected successfully"));
                });

                messageBus.on('error', function(err){
                    done();
                })
            })
            .catch(done);
    });

    it('should allow access to websocket once logged in', function(done){

        var disconnected = false;

        logInUserAndOpenSocket(testUsername, testUserPassword)
            .then(function verifySocketIsUpAndFunctional(messageBus){
                messageBus.on('connect', function () {
                    console.log("WE ARE CONNECTED");
                    messageBus.emit('hi!');
                });

                messageBus.on('a message', function(data){
                    if(!disconnected){
                        disconnected = true;
                        messageBus.disconnect();
                        console.log(JSON.stringify(data));
                        done();
                    }
                });

                messageBus.on('disconnect', function(){

                });
            }).catch(done);
    });

});
