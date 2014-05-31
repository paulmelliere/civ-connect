var controllersModule = angular.module('controllersModule');

// Frame Controller
controllersModule.controller('mainController', ['$scope', 'Auth', '$location', '$http',
    function ($scope, Auth, $location, $http) {

        $scope.$watch(Auth.isLoggedIn, function (value, oldValue) {

            if (!value && oldValue) {
                console.log("disconnect");
                $location.path('/');
            }

            if (value) {
                console.log("Connect");
                $location.path('/report');

            }

        }, true);

    }]
);