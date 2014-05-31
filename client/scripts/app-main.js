'use strict';

/* App Module */

var civConnect = angular.module('civConnect', ['controllersModule', 'ngRoute', 'ui.bootstrap', 'angular-carousel']);


civConnect.run(['$rootScope', '$location', 'Auth', function ($rootScope, $location, Auth) {
    $rootScope.$on('$routeChangeStart', function (event) {

        if (!Auth.isLoggedIn()) {
            console.log('DENY');
            event.preventDefault();
            $location.path('/');
        }
        else {
            console.log('ALLOW');
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
            when('/myreports', {
                templateUrl: 'partials/myreports.html',
                controller: 'myReportsController'
            }).
            when('/home', {
                templateUrl: 'partials/home.html',
                controller: 'homePageCtrl'
            }).
            otherwise({
                templateUrl: 'partials/login.html',
                controller: 'loginController'
            });

        $httpProvider.defaults.xsrfHeaderName = 'X-CSRFToken';
        $httpProvider.defaults.xsrfCookieName = 'csrftoken';
    }]);