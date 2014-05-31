'use strict';

/* App Module */

var civConnect = angular.module('civConnect', ['controllersModule', 'ngRoute']);


civConnect.run(['$rootScope', '$location', 'Auth', function ($rootScope, $location, Auth) {
    $rootScope.$on('$routeChangeStart', function (event) {

        if (!Auth.isLoggedIn()) {
            console.log('DENY');
            event.preventDefault();
            $location.path('/');
        }
        else {
            console.log('ALLOW');
            $location.path('/report');
        }
    });
}]);

civConnect.config(['$routeProvider', '$httpProvider',
    function($routeProvider, $httpProvider) {
        $routeProvider.
            when('/report', {
                templateUrl: 'partials/report.html',
                controller: 'reportController'
            }).
            otherwise({
                templateUrl: 'partials/login.html',
                controller: 'loginController'
            });

        $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
        $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    }]);