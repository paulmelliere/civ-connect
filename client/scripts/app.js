function MainViewModel() {
    // Data
    var self = this;

    self.chosenLogin = ko.observable();
    self.chosenLogout = ko.observable();
    self.chosenHomePage = ko.observable();
    self.username = ko.observable();
    self.isLoggedIn = ko.observable(false);
    self.isNotLoggedIn = ko.computed(function(){return !self.isLoggedIn()});

    // Behaviours
    self.gotoLogin = function(){location.hash = 'login';};
    self.gotoLogout = function(){location.hash = 'logout';};
    self.gotoHome = function(){location.hash = 'home';};

    // Client-side routes
    Sammy(function () {

//        this.get('#:folder/:mailId', function () {
//            self.chosenFolderId(this.params.folder);
//            self.chosenFolderData(null);
//            $.get("/mail", { mailId: this.params.mailId }, self.chosenMailData);
//        });

        this.get('#login', function(){
            self.chosenLogin({'failReason':''});
            self.chosenLogout(null);
            self.chosenHomePage(null);
            self.username(null);
        });

        this.post('#login', function onLoginRoute(context){
            console.log("Pretending to login with u:'" + context.params['username'] + "' and pw:'" + context.params['password'] + "'");
            var params = {'username':context.params['username'], 'password':context.params['password']};

            $.ajax({
                'url':'/login/',
                'type': "POST",
                'data': params,
                'dataType': 'json'
            })
            .done(function onLoginDone(data){
                console.log("login done with data: ");
                self.chosenLogin({'failReason':''});
                console.log(JSON.stringify(data));
                self.isLoggedIn(true);
                //router.app.runRoute('get', '#home');
                self.gotoHome();
            })
            .fail(function onLoginFail(data){
                console.log("login failed with data: ");
                console.log(JSON.stringify(data));
                self.isLoggedIn(false);
                self.chosenLogin({'failReason':data.responseJSON.message + "<br/><br/>"});
            });
            return false;
        });

        this.get('#logout', function(){
            self.chosenLogin(null);
            self.chosenLogout({'failReason':''});
            self.chosenHomePage(null);
            $.ajax({
                'url':'/logout/',
                'type': "get"
            })
            .done(function onLogoutDone(data){
                console.log("logout done with data: ");
                console.log(JSON.stringify(data));
                self.isLoggedIn(false);
                self.gotoHome();
            })
            .fail(function onLoginFail(data){
                console.log("logout failed with data: ");
                console.log(JSON.stringify(data));
                self.chosenLogout({'failReason':data.responseJSON.message + "<br/><br/>"});
            });
        });

        this.get('#home', function onHomeRoute(){
            self.chosenLogin(null);
            self.chosenLogout(null);
            self.chosenHomePage({'data':null});
            $.ajax({
                'url':'/user/',
                'type': "GET"
            })
            .done(function onUserDone(data){
                console.log("data from /user:" + JSON.stringify(data));
                self.username(data.username);
                self.isLoggedIn(!!data.username);
            })
            .fail(function onUserFail(data){
                console.log("FAILURE data from /user:" + JSON.stringify(data));
                self.username(null);
                self.isLoggedIn(false);
            });

            $.ajax({
                'url':'/authonly/',
                'type': "GET"
            })
            .done(function onAuthOnlyDone(data){
                console.log("auth done with data: ");
                console.log(JSON.stringify(data));
                self.chosenHomePage({'data':JSON.stringify(data)});
            })
            .fail(function onAuthOnlyFail(data){
                console.log("auth failed with data: ");
                console.log(JSON.stringify(data));
                self.chosenHomePage({'data':'not for your eyes!'})
            });

        });

        this.get('', function () { this.app.runRoute('get', '#home') });

    }).run();
}