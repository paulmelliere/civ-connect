var controllersModule = angular.module('controllersModule');

// Frame Controller
controllersModule.controller('loginController', ['$scope', '$location', '$http',
    function ($scope, $location, $http) {

        $scope.user = {};

        $scope.login = function(user, pass) {
            var params = {'username':user, 'password':pass};

            $http.post('/login/', params)
            .success(function (data){
                alert('logged in!');

                /*console.log("login done with data: ");
                self.chosenLogin({'failReason':''});
                console.log(JSON.stringify(data));
                self.isLoggedIn(true);
                //router.app.runRoute('get', '#home');
                self.gotoHome();*/
            })
            .error(function (data){
                alert('failed');
                    /*
                console.log("login failed with data: ");
                console.log(JSON.stringify(data));
                self.isLoggedIn(false);
                self.chosenLogin({'failReason':data.responseJSON.message + "<br/><br/>"});*/
            });
        } ;

       /* // Sets the sidebar "active" class based on the current url
        $scope.isActive = function (viewLocation) {
            var active = $location.path().substring(0, viewLocation.length) === viewLocation;
            return active;
        };*/
    }
]);

